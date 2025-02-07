let ws;
let errorTimeout;

function connect() {
  const path = window.location.pathname;
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}${path}`;

  ws = new WebSocket(wsUrl);

  ws.onmessage = (event) => {
    const msg = JSON.parse(event.data);
    if (msg.type === 'state') {
      updateUI(msg.payload);
    } else if (msg.type === 'error') {
      showError(msg.payload.error);
    } else if (msg.type === 'message') {
      alert(`${msg.payload.sender}: ${msg.payload.message}`);
    }
  };

  ws.onclose = () => setTimeout(connect, 1000);
}

function updateUI(state) {
  // Update counter
  document.getElementById('count').textContent = state.data.count;

  // Update agents list
  const agentsList = document.getElementById('agents');
  agentsList.innerHTML = '';

  if (state.agents.length === 0) {
    agentsList.innerHTML = '<li class="no-agents">No agents</li>';
    return;
  }

  state.agents.forEach(name => {
    const li = document.createElement('li');
    li.innerHTML = `
      <div class="agent-row">
        <a href="${window.location.pathname === '/' ? '' : window.location.pathname}/${name}">${name}</a>
        <div class="agent-controls">
          <input type="text" placeholder="Message" class="message-input" aria-label="Message for ${name}">
          <button onclick="sendMessageTo('${name}')" class="send-btn">Send</button>
          <button onclick="deleteAgent('${name}')" class="delete-btn">Delete</button>
        </div>
      </div>
    `;
    agentsList.appendChild(li);
  });
}

function showError(message) {
  clearTimeout(errorTimeout);

  let error = document.querySelector('.error');
  if (!error) {
    error = document.createElement('div');
    error.className = 'error';
    document.body.appendChild(error);
  }

  error.textContent = message;
  errorTimeout = setTimeout(() => error.remove(), 3000);
}

function sendMessage(msg) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg));
  }
}

// Event Listeners
document.getElementById('increment')?.addEventListener('click', () => {
  sendMessage({ type: 'increment' });
});

document.getElementById('create-agent')?.addEventListener('click', () => {
  const input = document.getElementById('agent-name');
  const name = input.value.trim();

  if (name) {
    sendMessage({
      type: 'createAgent',
      payload: { name }
    });
    input.value = '';
  }
});

function deleteAgent(name) {
  sendMessage({
    type: 'deleteAgent',
    payload: { name }
  });
}

// Initialize connection
connect();

function sendMessageTo(recipient) {
  const row = document.querySelector(`[onclick="sendMessageTo('${recipient}')"]`).closest('.agent-row');
  const message = row.querySelector('.message-input').value.trim();

  if (message) {
    sendMessage({
      type: 'sendMessage',
      payload: {
        recipient,
        message
      }
    });
    row.querySelector('.message-input').value = '';
  }
}

function showMessage(payload) {
  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.textContent = `${payload.sender}: ${payload.message}`;
  document.querySelector('.messages').appendChild(messageDiv);
  setTimeout(() => messageDiv.remove(), 5000);
}

function broadcastMessage() {
  const input = document.getElementById('broadcast-text');
  const message = input.value.trim();

  if (message) {
    sendMessage({
      type: 'broadcast',
      payload: { message }
    });
    input.value = '';
  }
}

document.getElementById('broadcast-btn')?.addEventListener('click', () => {
  broadcastMessage();
});