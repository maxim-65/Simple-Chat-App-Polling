# Simple Chat App with Polling

Minimal chat app using a fixed backend port and a simple frontend served from `client/`.

## Quick Start

1. Install dependencies:

```bash
npm install
```

2. Start the backend server:

```bash
npm start
```

3. Serve the frontend from the `client` folder:

```bash
cd client && python -m http.server 8000
```

4. Open `http://localhost:8000` in your browser.

## What Runs Where

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:8000`
- Frontend uses polling to refresh messages every 3 seconds.

## Project Files

- `server/index.js` — Express API server
- `client/index.html` — chat UI
- `client/style.css` — styles
- `client/script.js` — polling client logic
- `package.json` — project scripts and dependencies

## Notes

- Backend stores messages in memory and resets on restart.
- Frontend expects the backend on `http://localhost:3000`.
- No extra setup is required aside from Node.js and Python.
