/**
 * Simple Chat App Backend
 * Minimal Express server with in-memory message storage.
 */

const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json({ limit: '100kb' }));

let messages = [];
let nextMessageId = 1;

app.get('/messages', (req, res) => {
  const sortedMessages = [...messages].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
  res.json({ success: true, data: sortedMessages });
});

app.post('/messages', (req, res) => {
  const { text } = req.body;

  if (typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ success: false, error: 'Message text is required' });
  }

  const trimmedText = text.trim();
  if (trimmedText.length > 500) {
    return res.status(400).json({ success: false, error: 'Message text must be 500 characters or fewer' });
  }

  const message = {
    id: nextMessageId++,
    text: trimmedText,
    timestamp: new Date().toISOString(),
  };

  messages.push(message);
  // Keep only last 50 messages
  if (messages.length > 50) {
    messages = messages.slice(-50);
  }
  res.status(201).json({ success: true, data: message });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});

app.use((err, req, res, next) => {
  console.error('Server error:', err && err.message ? err.message : err);

  if (err && (err.type === 'entity.parse.failed' || err instanceof SyntaxError)) {
    return res.status(400).json({ error: 'Invalid JSON payload' });
  }

  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
