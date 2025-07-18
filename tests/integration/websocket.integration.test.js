// tests/integration/websocket-integration.test.js
const request = require('supertest');
const Client = require('socket.io-client');
const app = require('../../backend/src/server');

describe('WebSocket Integration Tests', () => {
  let clientSocket;
  let authToken;
  const wsUrl = 'http://localhost:3000';

  beforeAll(async () => {
    // Register and login a test user
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'wstest@example.com',
        password: 'password123',
        fullName: 'WebSocket Test User'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'wstest@example.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  beforeEach((done) => {
    // Create new client for each test
    clientSocket = Client(wsUrl, {
      transports: ['websocket'],
      forceNew: true
    });

    clientSocket.on('connect', () => {
      done();
    });
  });

  afterEach(() => {
    if (clientSocket.connected) {
      clientSocket.disconnect();
    }
  });

  test('WebSocket receives updates when order is placed via API', (done) => {
    // First authenticate WebSocket
    clientSocket.emit('authenticate', authToken);

    clientSocket.on('authenticated', async () => {
      // Listen for order update
      clientSocket.on('order-update', (data) => {
        expect(data).toHaveProperty('orderId');
        expect(data.symbol).toBe('AAPL');
        expect(data.status).toBe('FILLED');
        done();
      });

      // Place order via API
      await request(app)
        .post('/api/orders/place')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          symbol: 'AAPL',
          orderType: 'BUY',
          quantity: 5,
          price: 150
        });
    });
  });

  test('Multiple clients receive market updates', (done) => {
    const client2 = Client(wsUrl, {
      transports: ['websocket'],
      forceNew: true
    });

    let updatesReceived = 0;
    const checkComplete = () => {
      updatesReceived++;
      if (updatesReceived === 2) {
        client2.disconnect();
        done();
      }
    };

    // Both clients subscribe to same symbol
    clientSocket.emit('subscribe-market', ['AAPL']);
    client2.emit('subscribe-market', ['AAPL']);

    // Both should receive the update
    clientSocket.on('market-update', (data) => {
      expect(data.symbol).toBe('AAPL');
      checkComplete();
    });

    client2.on('market-update', (data) => {
      expect(data.symbol).toBe('AAPL');
      checkComplete();
    });

    // Trigger market update through your service
    setTimeout(() => {
      // This would be triggered by your market simulator
      const websocketService = require('../../backend/src/services/websocketService');
      websocketService.broadcastMarketUpdate('AAPL', {
        price: 155.00,
        previousPrice: 150.00,
        change: 5.00,
        changePercent: 3.33
      });
    }, 100);
  });

  test('WebSocket stats endpoint reflects connections', async () => {
    // Connect and authenticate
    clientSocket.emit('authenticate', authToken);

    await new Promise(resolve => {
      clientSocket.on('authenticated', resolve);
    });

    // Subscribe to some symbols
    clientSocket.emit('subscribe-market', ['AAPL', 'GOOGL']);

    // Wait a bit for subscription to process
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check stats via API
    const response = await request(app)
      .get('/api/websocket/stats')
      .expect(200);

    expect(response.body.totalConnections).toBeGreaterThan(0);
    expect(response.body.marketSubscriptions).toHaveProperty('AAPL');
    expect(response.body.marketSubscriptions).toHaveProperty('GOOGL');
  });
});