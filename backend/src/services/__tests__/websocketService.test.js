// backend/src/services/__tests__/websocket.test.js
const Client = require('socket.io-client');
const http = require('http');
const SocketService = require('../websocketService');

describe('WebSocket Service', () => {
  let server, clientSocket, serverSocket;

  beforeAll((done) => {
    server = http.createServer();
    const io = require('socket.io')(server);
    
    SocketService.initialize(io);
    
    server.listen(() => {
      const port = server.address().port;
      clientSocket = Client(`http://localhost:${port}`);
      
      io.on('connection', (socket) => {
        serverSocket = socket;
      });
      
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    server.close();
    clientSocket.close();
  });

  test('should authenticate client with valid token', (done) => {
    clientSocket.on('authenticated', (data) => {
      expect(data).toHaveProperty('userId');
      done();
    });

    clientSocket.emit('authenticate', 'valid-jwt-token');
  });

  test('should broadcast market updates to subscribed clients', (done) => {
    clientSocket.on('market-update', (data) => {
      expect(data).toMatchObject({
        symbol: 'AAPL',
        price: expect.any(Number),
        timestamp: expect.any(String)
      });
      done();
    });

    clientSocket.emit('subscribe-market', ['AAPL']);
    
    // Simulate market update
    SocketService.broadcastMarketUpdate('AAPL', { price: 150.50 });
  });
});