import { Hono } from 'hono'
import { DurableObjectNamespace, DurableObjectState } from '@cloudflare/workers-types'
import type { Request as CFRequest } from '@cloudflare/workers-types'

interface Env {
  FLEET_DO: DurableObjectNamespace,
}

interface AgentState {
  data: {
    count: number;
  };
  agents: string[];
}

type WSMessage = {
  type: 'increment' | 'createAgent' | 'deleteAgent' | 'sendMessage' | 'broadcast';
  payload?: {
    name?: string;
    message?: string;
    recipient?: string;
  };
}

type WSResponse = {
  type: 'state' | 'error' | 'message' | 'broadcast';
  payload: {
    data?: { count: number };
    agents?: string[];
    error?: string;
    message?: string;
    sender?: string;
  };
}

// The Worker: routes all requests through Hono
const app = new Hono<{ Bindings: Env }>()

// Route everything else to DOs
app.all('*', async (c) => {
  const path = new URL(c.req.url).pathname
  const parts = path.split('/').filter(Boolean)
  const doName = parts.length === 0 ? '/' : `/${parts.join('/')}`

  const id = c.env.FLEET_DO.idFromName(doName)
  const stub = c.env.FLEET_DO.get(id)
  return stub.fetch(c.req.raw as CFRequest)
})

export default {
  fetch: app.fetch
}

export class FleetDO {
  private app = new Hono()
  private connections = new Set<WebSocket>()

  constructor(private durableState: DurableObjectState, private env: Env) {
    this.app.get('*', c => {
      const upgradeHeader = c.req.header('Upgrade')
      if (upgradeHeader?.toLowerCase() === 'websocket') {
        return this.handleWebSocket(c)
      }
      return this.handleView(c)
    })

    this.app.delete('*', async () => {
      const data = await this.getState()

      if (data?.agents) {
        const path = new URL(this.durableState.id.toString()).pathname
        for (const agent of data.agents) {
          const childPath = path === '/' ? `/${agent}` : `${path}/${agent}`
          const childId = this.env.FLEET_DO.idFromName(childPath)
          const childStub = this.env.FLEET_DO.get(childId)
          await childStub.fetch(new Request(childPath, { method: 'DELETE' }))
        }
      }

      for (const ws of this.connections) {
        ws.close(1000, 'Agent deleted')
      }

      await this.durableState.storage.deleteAll()
      return new Response('OK')
    })

    this.app.post('*/_message', async c => {
      const body = await c.req.json()
      console.log(c.req.raw, { body })

      if (body.type === 'message') {
        this.broadcast({
          type: 'message',
          payload: {
            message: body.payload.message,
            sender: body.payload.sender
          }
        })
        return c.json({ success: true })
      }
      return c.json({ error: 'Invalid message type' }, 400)
    })
  }

  async fetch(request: Request) {
    return this.app.fetch(request)
  }

  private validateAgentName(name: string): boolean {
    return /^[a-zA-Z0-9-_]{1,32}$/.test(name)
  }

  private async getState(): Promise<AgentState> {
    return await this.durableState.storage.get<AgentState>('data') || {
      data: { count: 0 },
      agents: []
    }
  }

  private async setState(data: AgentState): Promise<void> {
    await this.durableState.storage.put('data', data)
  }

  private async handleView(c: any) {
    const data = await this.getState()
    const path = new URL(c.req.url).pathname
    const segments = path.split('/').filter(Boolean)

    // Build breadcrumb HTML
    const breadcrumbs = segments.map((segment, index) => {
      const pathToHere = '/' + segments.slice(0, index + 1).join('/')
      return `<a href="${pathToHere}" class="breadcrumb-link">${segment}</a>`
    })

    return c.html(`
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width">
          <title>Fleet</title>
          <script src="/ui.js" defer></script>
          <link rel="stylesheet" href="/style.css">
        </head>
        <body>
          <div id="app">
            <nav aria-label="Breadcrumb navigation">
              <div class="breadcrumbs">
                <a href="/" class="breadcrumb-link">root</a>
                ${breadcrumbs.length > 0 ? '/ ' + breadcrumbs.join(' / ') : ''}
              </div>
            </nav>
            
            <div class="card">
              <h2>Data</h2>
              <pre id="data"><code>${JSON.stringify(data, null, 2)}</code></pre>
              <button id="increment"><span id="count">${data.data.count}</span></button>
            </div>

            <div class="card">
              <h2>Agents</h2>
              <ul id="agents"></ul>
              
              <div class="create-agent">
                <input type="text" id="agent-name" placeholder="Agent name">
                <button id="create-agent">Create Agent</button>
              </div>

              <div class="broadcast-message">
                <input type="text" id="broadcast-text" placeholder="Message all agents">
                <button id="broadcast-btn">Broadcast</button>
              </div>
            </div>
          </div>
        </body>
      </html>
    `);
  }

  private async handleWebSocket(c: any) {
    const pair = new WebSocketPair()
    const [client, server] = Object.values(pair)
    const path = new URL(c.req.url).pathname

    server.accept()
    const data = await this.getState()
    server.send(JSON.stringify({ type: 'state', payload: data }))

    this.addConnection(path, server)

    server.addEventListener('close', () => {
      this.connections.delete(server)
    })

    server.addEventListener('message', async event => {
      try {
        const msg = JSON.parse(event.data as string) as WSMessage
        const data = await this.getState()
        const path = new URL(c.req.url).pathname
        const senderName = path.split('/').filter(Boolean).pop() || 'root'

        switch (msg.type) {
          case 'increment':
            data.data.count++
            await this.setState(data)
            break

          case 'createAgent':
            if (!msg.payload?.name) throw new Error('Agent name required')
            if (!this.validateAgentName(msg.payload.name)) {
              throw new Error('Invalid agent name')
            }
            if (data.agents.includes(msg.payload.name)) {
              throw new Error('Agent already exists')
            }
            data.agents.push(msg.payload.name)
            await this.setState(data)
            break

          case 'deleteAgent':
            if (!msg.payload?.name) throw new Error('Agent name required')
            const index = data.agents.indexOf(msg.payload.name)
            if (index === -1) throw new Error('Agent not found')
            const childPath = path === '/' ? `/${msg.payload.name}` : `${path}/${msg.payload.name}`
            const childId = this.env.FLEET_DO.idFromName(childPath)
            const childStub = this.env.FLEET_DO.get(childId)
            await childStub.fetch(new Request(`https://internal${childPath}`, { method: 'DELETE' }))

            data.agents.splice(index, 1)
            await this.setState(data)
            break

          case 'sendMessage':
            if (!msg.payload?.message) throw new Error('Message required')
            if (!msg.payload?.recipient) throw new Error('Recipient required')
            if (!data.agents.includes(msg.payload.recipient)) {
              throw new Error('Recipient not found')
            }

            const recipientPath = path === '/' ? `/${msg.payload.recipient}` : `${path}/${msg.payload.recipient}`
            const recipientId = this.env.FLEET_DO.idFromName(recipientPath)
            const recipientStub = this.env.FLEET_DO.get(recipientId)

            // Send message to recipient's DO instance
            const response = await recipientStub.fetch(new Request(`https://internal${recipientPath}/_message`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                type: 'message',
                payload: {
                  message: msg.payload.message,
                  sender: senderName
                }
              })
            }))

            break

          case 'broadcast':
            if (!msg.payload?.message) throw new Error('Message required')

            // Send message to all direct child agents
            for (const agent of data.agents) {
              const childPath = path === '/' ? `/${agent}` : `${path}/${agent}`
              const childId = this.env.FLEET_DO.idFromName(childPath)
              const childStub = this.env.FLEET_DO.get(childId)

              await childStub.fetch(new Request(`https://internal${childPath}/_message`, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  type: 'message',
                  payload: {
                    message: msg.payload.message,
                    sender: senderName
                  }
                })
              }))
            }
            break
        }

        this.broadcast({ type: 'state', payload: data })

      } catch (err) {
        server.send(JSON.stringify({
          type: 'error',
          payload: { error: err.message }
        }))
      }
    })

    return new Response(null, {
      status: 101,
      webSocket: client,
    })
  }

  private broadcast(msg: WSResponse) {
    const message = JSON.stringify(msg)
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message)
      }
    })
  }

  private addConnection(path: string, ws: WebSocket) {
    this.connections.add(ws)
  }

  private removeConnection(path: string, ws: WebSocket) {
    this.connections.delete(ws)
  }
}

