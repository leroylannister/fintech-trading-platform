// tests/unit/websocket.test.js
const Client = require('socket.io-client');
const server = require('../../backend/src/server');

describe('WebSocket Tests', () => {
  let clientSocket;
  let serverSocket;

  beforeAll((done) => {
    server.listen(() => {
      const port = server.address().port;
      clientSocket = new Client(`http://localhost:${port}`);
      server.on('connection', (socket) => {
        serverSocket = socket;
      });
      clientSocket.on('connect', done);
    });
  });

  afterAll(() => {
    server.close();
    clientSocket.close();
  });

  test('should receive market updates', (done) => {
    clientSocket.on('market-update', (data) => {
      expect(data).toHaveProperty('symbol');
      expect(data).toHaveProperty('price');
      done();
    });

    serverSocket.emit('market-update', {
      symbol: 'AAPL',
      price: 150.50
    });
  });
});