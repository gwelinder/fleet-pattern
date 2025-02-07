# Fleet - Hierarchical Durable Objects Demo

A demonstration of hierarchical Durable Objects in Cloudflare Workers, enabling infinite nesting of manager/agent relationships through URL paths.

![alt text](https://github.com/acoyfellow/fleet-pattern/blob/main/public/fleet-pattern.jpg?raw=true)

## Features

- **Single DO Architecture**: Unified Durable Object class handling both manager and agent roles
- **Dynamic Hierarchy**: Automatic DO creation and management based on URL paths
- **Real-time Updates**: WebSocket-based communication for instant state changes
- **Production Ready**:
  - Input validation
  - Error handling
  - Type safety
  - Clean shutdown procedures

## Setup

1. Copy `wrangler.example.toml` to `wrangler.toml`:
```bash
cp wrangler.example.toml wrangler.toml
```

2. Install dependencies:
```bash
npm install
# or if using bun
bun install
```

3. Start the development server:
```bash
npm run dev
# or
bun run dev
```

4. Deploy to Cloudflare Workers:
```bash
npm run deploy
# or
bun run deploy
```

## Architecture

### URL-Based Hierarchy
```
Root (/)
├── agent1
│   ├── subagent1
│   └── subagent2
│       └── subagent2
└── agent2
    └── subagent3
```

Each path segment represents a unique Durable Object instance, creating an infinitely nestable hierarchy.

### State Management

Each DO maintains:
- Local counter
- List of child agents
- WebSocket connections

### Communication

- **WebSocket Protocol**: Real-time bidirectional communication
- **Message Types**:
  - `increment`: Update local counter
  - `createAgent`: Spawn new child agent
  - `deleteAgent`: Remove child agent and its subtree
  - `state`: Current DO state updates
  - `error`: Error notifications

## Security

- Input validation for agent names (alphanumeric, dash, underscore, 1-32 chars)
- Secure WebSocket handling with proper connection lifecycle
- Hierarchical deletion safety with cascading cleanup

## Example Usage

1. **Root Manager** (`/`):
   - View and manage top-level agents
   - Monitor system state

2. **Agent Management**:
   - Create: Enter agent name and click "Create"
   - Navigate: Click agent names to traverse hierarchy
   - Delete: Remove agents and their complete subtree

3. **Agent Communication**:
   - Direct Message: Use the message input field next to each agent to send them a private message
   - Broadcast: Use the broadcast input at the bottom to send a message to all child agents
   - Messages appear as alerts and are ephemeral (not stored)

4. **Nested Structures**:
   - `/team1/project1/task1`
   - `/region1/server1/process1`
   - `/department1/group1/user1`

## Technical Stack

- **Runtime**: [Cloudflare Workers](https://workers.cloudflare.com/)
- **State Management**: [Durable Objects](https://developers.cloudflare.com/workers/runtime-apis/durable-objects/)
- **Framework**: [Hono](https://hono.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Real-time**: WebSocket API

## Production Considerations

- Handles cascading deletions safely
- Provides real-time error feedback
- Maintains WebSocket connection state
- Implements proper error handling and validation

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.
