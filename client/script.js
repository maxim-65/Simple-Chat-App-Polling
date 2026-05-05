/**
 * Simple Chat App - Frontend Logic
 * Minimal polling chat client for localhost.
 */

const API_URL = 'http://localhost:3000';
const POLL_INTERVAL = 3000;
const SCROLL_THRESHOLD = 100;

let lastMessageId = 0;
let isFetching = false;
let isSending = false;
let pollIntervalId = null;

const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const sendBtnText = document.getElementById('sendBtnText');
const statusText = document.getElementById('status-text');
const statusDot = document.querySelector('.status-dot');

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatTimestamp(isoString) {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return 'Invalid time';
  }
  return date.toLocaleTimeString();
}

function isNearBottom() {
  return (
    messagesContainer.scrollHeight - messagesContainer.scrollTop - messagesContainer.clientHeight <
    SCROLL_THRESHOLD
  );
}

function scrollToBottom() {
  messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function createMessageElement(message) {
  const text = typeof message.text === 'string' ? message.text : '';
  const timestamp = typeof message.timestamp === 'string' ? message.timestamp : '';

  const messageDiv = document.createElement('div');
  messageDiv.className = 'message';
  messageDiv.dataset.messageId = message.id || '';

  messageDiv.innerHTML = `
    <div class="message-content">
      <div class="message-text">${escapeHtml(text)}</div>
      <div class="message-timestamp">${escapeHtml(formatTimestamp(timestamp))}</div>
    </div>
  `;

  return messageDiv;
}

function clearEmptyState() {
  const emptyDiv = messagesContainer.querySelector('.messages-empty');
  if (emptyDiv) {
    emptyDiv.remove();
  }
}

function normalizeMessages(data) {
  if (!Array.isArray(data)) {
    return [];
  }
  return data.filter((item) => item && typeof item === 'object');
}

async function fetchMessages() {
  if (isFetching) return;

  try {
    isFetching = true;
    const response = await fetch(`${API_URL}/messages`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    const data = await response.json();
    const messages = normalizeMessages(data);
    const newMessages = messages.filter((msg) => Number(msg.id) > lastMessageId);

    if (newMessages.length > 0) {
      if (lastMessageId === 0) {
        clearEmptyState();
      }

      const shouldScroll = isNearBottom();
      newMessages.forEach((message) => {
        const element = createMessageElement(message);
        messagesContainer.appendChild(element);
        lastMessageId = Math.max(lastMessageId, Number(message.id) || lastMessageId);
      });

      if (shouldScroll) {
        scrollToBottom();
      }
    }

    updateStatus(true, 'Online');
  } catch (error) {
    console.error('Fetch failed:', error && error.message ? error.message : error);
    updateStatus(false, 'Disconnected');
  } finally {
    isFetching = false;
  }
}

async function sendMessage() {
  if (isSending) return;

  const text = messageInput.value.trim();
  if (text.length === 0) {
    messageInput.focus();
    return;
  }

  try {
    isSending = true;
    messageInput.disabled = true;
    sendBtn.disabled = true;
    sendBtnText.textContent = 'Sending...';

    const response = await fetch(`${API_URL}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || `HTTP ${response.status}`);
    }

    messageInput.value = '';
    updateSendButtonState();
    await fetchMessages();
  } catch (error) {
    console.error('Send failed:', error && error.message ? error.message : error);
    updateStatus(false, 'Disconnected');
  } finally {
    isSending = false;
    messageInput.disabled = false;
    sendBtnText.textContent = 'Send';
    updateSendButtonState();
    messageInput.focus();
  }
}

function updateStatus(isConnected, message) {
  statusDot.style.backgroundColor = isConnected ? '#4ade80' : '#ef4444';
  statusText.textContent = message || (isConnected ? 'Online' : 'Disconnected');
}

function updateSendButtonState() {
  const hasText = messageInput.value.trim().length > 0;
  sendBtn.disabled = !hasText || isSending;
}

function startPolling() {
  fetchMessages();
  pollIntervalId = setInterval(fetchMessages, POLL_INTERVAL);
}

function stopPolling() {
  if (pollIntervalId) {
    clearInterval(pollIntervalId);
    pollIntervalId = null;
  }
}

function handleGlobalError(event) {
  console.error('Uncaught error:', event.error || event.message || event);
  updateStatus(false, 'Disconnected');
}

function initialize() {
  updateStatus(false, 'Connecting...');
  updateSendButtonState();

  sendBtn.addEventListener('click', sendMessage);
  messageInput.addEventListener('input', updateSendButtonState);
  messageInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      sendMessage();
    }
  });

  window.addEventListener('beforeunload', stopPolling);
  window.addEventListener('error', handleGlobalError);
  window.addEventListener('unhandledrejection', handleGlobalError);

  startPolling();
}

document.addEventListener('DOMContentLoaded', initialize);
