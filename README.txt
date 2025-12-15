Stock Broker Client Web Dashboard (Node.js + WebSockets)

Quick start:

1. Make sure you have Node.js (v16+) installed.
2. Extract the project and open a terminal in the project folder.
3. Install dependencies:
   npm install
4. Start server:
   npm start
5. Open a browser to http://localhost:3000
   - Open two different browser windows/tabs to simulate two users.
   - Login with an email (any email works).
   - Subscribe to supported tickers (click supported buttons or type ticker and Subscribe).
   - You will see prices update every second without page refresh.

Project structure:
- server.js       : Node/Express + ws WebSocket server
- public/index.html : Frontend dashboard
- public/app.js     : Client JS for WebSocket interactions
- package.json
