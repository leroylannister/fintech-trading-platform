// tests/security/sql-injection.test.js
const request = require('supertest');
const app = require('../../backend/src/server');

describe('SQL Injection Tests', () => {
  const sqlInjectionPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE users; --",
    "1' UNION SELECT * FROM users--",
    "admin'--",
    "' OR 1=1--",
    "\" OR \"\"=\""
  ];

  test('Login endpoint should be protected against SQL injection', async () => {
    for (const payload of sqlInjectionPayloads) {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: payload,
          password: payload
        });

      expect(response.status).toBe(401);
      expect(response.body).not.toHaveProperty('token');
    }
  });

  test('Order placement should sanitize inputs', async () => {
    const token = await getAuthToken();
    
    for (const payload of sqlInjectionPayloads) {
      const response = await request(app)
        .post('/api/orders/place')
        .set('Authorization', `Bearer ${token}`)
        .send({
          symbol: payload,
          orderType: 'BUY',
          quantity: 1,
          price: 100
        });

      expect(response.status).toBe(400);
    }
  });
});