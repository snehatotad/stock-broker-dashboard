const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

app.use(express.static(path.join(__dirname, 'public')));

// Supported stocks and initial prices
const STOCKS = {
  'GOOG': 135.00,
  'TSLA': 230.00,
  'AMZN': 120.00,
  'META': 260.00,
  'NVDA': 405.00
};

// Random walk update for stocks (mutates STOCKS)
function updatePrices() {
  for (const s in STOCKS) {
    // small random percent change -1% .. +1%
    const changePct = (Math.random() * 2 - 1) * 0.01;
    const old = STOCKS[s];
    const next = Math.max(0.01, +(old * (1 + changePct)).toFixed(2));
    STOCKS[s] = next;
  }
}

// Broadcast to each client only the stocks they subscribed to
function broadcastPrices() {
  // Update prices first
  updatePrices();
  const snapshot = {...STOCKS};
  wss.clients.forEach(ws => {
    if (ws.readyState === WebSocket.OPEN) {
      const subs = ws.subscriptions || [];
      // if no subscriptions, optionally send nothing or send available list
      const payload = {};
      subs.forEach(t => {
        if (snapshot[t] !== undefined) payload[t] = snapshot[t];
      });
      // send heartbeat of available stocks if client asks for 'all'
      if (ws.send && (subs.length > 0)) {
        ws.send(JSON.stringify({type: 'prices', prices: payload, ts: Date.now()}));
      }
    }
  });
}

// Interval to broadcast every second
setInterval(broadcastPrices, 1000);

wss.on('connection', (ws, req) => {
  // initialize per-connection subscriptions
  ws.subscriptions = [];

  // send supported list on connect
  ws.send(JSON.stringify({type: 'supported', stocks: Object.keys(STOCKS)}));

  ws.on('message', message => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === 'login') {
        ws.email = msg.email || 'anonymous';
        ws.send(JSON.stringify({type: 'login_ok', email: ws.email}));
      } else if (msg.type === 'subscribe') {
        const ticker = String(msg.ticker || '').toUpperCase();
        if (STOCKS[ticker] !== undefined && !ws.subscriptions.includes(ticker)) {
          ws.subscriptions.push(ticker);
          ws.send(JSON.stringify({type: 'subscribed', ticker}));
        }
      } else if (msg.type === 'unsubscribe') {
        const ticker = String(msg.ticker || '').toUpperCase();
        ws.subscriptions = ws.subscriptions.filter(t => t !== ticker);
        ws.send(JSON.stringify({type: 'unsubscribed', ticker}));
      } else if (msg.type === 'get_supported') {
        ws.send(JSON.stringify({type: 'supported', stocks: Object.keys(STOCKS)}));
      }
    } catch (e) {
      console.error('Invalid message', e);
    }
  });

  ws.on('close', () => {
    // cleanup if needed
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
