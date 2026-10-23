// AURA Companion — Background Service Worker
// Manages WebSocket bridge to the AURA desktop application

let socket = null;
let reconnectTimer = null;
let activeMediaTabId = null;
let currentMediaState = null;

const WS_URL = 'ws://127.0.0.1:48123';

function connectWebSocket() {
  if (socket && (socket.readyState === WebSocket.OPEN || socket.readyState === WebSocket.CONNECTING)) {
    return;
  }

  try {
    socket = new WebSocket(WS_URL);

    socket.onopen = () => {
      console.log('[AURA Extension] Connected to AURA Desktop App');
      chrome.action.setBadgeText({ text: 'ON' });
      chrome.action.setBadgeBackgroundColor({ color: '#F59E0B' }); // Amber

      // If we already have active media state, send it immediately
      if (currentMediaState) {
        sendToAura({
          type: 'browser_media_update',
          data: currentMediaState,
        });
      }
    };

    socket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleAuraCommand(message);
      } catch (err) {
        console.error('[AURA Extension] Failed to parse message:', err);
      }
    };

    socket.onclose = () => {
      console.log('[AURA Extension] Disconnected from AURA. Retrying in 4s...');
      chrome.action.setBadgeText({ text: '' });
      scheduleReconnect();
    };

    socket.onerror = (err) => {
      console.warn('[AURA Extension] WebSocket error:', err);
      socket.close();
    };
  } catch (e) {
    scheduleReconnect();
  }
}

function scheduleReconnect() {
  if (reconnectTimer) clearTimeout(reconnectTimer);
  reconnectTimer = setTimeout(connectWebSocket, 4000);
}

function sendToAura(payload) {
  if (socket && socket.readyState === WebSocket.OPEN) {
    socket.send(JSON.stringify(payload));
  }
}

function handleAuraCommand(msg) {
  if (msg.type === 'command' && activeMediaTabId) {
    chrome.tabs.sendMessage(activeMediaTabId, {
      type: 'EXECUTE_COMMAND',
      command: msg.action,
      value: msg.value,
    }).catch(() => {
      // Tab may have closed or navigated
    });
  }
}

// Receive state updates from content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'MEDIA_STATE_UPDATE') {
    activeMediaTabId = sender.tab ? sender.tab.id : null;
    currentMediaState = message.payload;

    sendToAura({
      type: 'browser_media_update',
      data: currentMediaState,
    });

    sendResponse({ received: true });
  } else if (message.type === 'GET_STATUS') {
    sendResponse({
      connected: socket && socket.readyState === WebSocket.OPEN,
      activeTab: activeMediaTabId,
      media: currentMediaState,
    });
  }
  return true;
});

// Start connection
connectWebSocket();
