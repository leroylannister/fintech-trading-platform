// tests/integration/api.test.js
const request = require('supertest');
const app = require('../../backend/src/server');

describe('API Integration Tests', () => {
  let authToken;

  beforeAll(async () => {
    // Register and login test user
    await request(app)
      .post('/api/auth/register')
      .send({
        email: 'integration@test.com',
        password: 'password123',
        fullName: 'Integration Test'
      });

    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'integration@test.com',
        password: 'password123'
      });

    authToken = loginResponse.body.token;
  });

  test('Complete trading flow', async () => {
    // 1. Get market prices
    const pricesResponse = await request(app)
      .get('/api/market/prices')
      .expect(200);

    expect(pricesResponse.body.prices).toBeInstanceOf(Array);

    // 2. Place order
    const orderResponse = await request(app)
      .post('/api/orders/place')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        symbol: 'AAPL',
        orderType: 'BUY',
        quantity: 5,
        price: 150
      })
      .expect(200);

    expect(orderResponse.body.order).toHaveProperty('id');

    // 3. Check portfolio
    const portfolioResponse = await request(app)
      .get('/api/portfolio')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);

    expect(portfolioResponse.body.portfolio.holdings).toContainEqual(
      expect.objectContaining({
        symbol: 'AAPL',
        quantity: 5
      })
    );
  });
});