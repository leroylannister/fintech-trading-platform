// tests/data-driven/orderScenarios.test.js
const fs = require('fs');
const csv = require('csv-parser');
const request = require('supertest');
const app = require('../../backend/src/server');
const { query } = require('../../backend/src/db/connection');

describe('Data-Driven Order Testing', () => {
  let authToken;
  const testScenarios = [];
  
  // Load CSV data before all tests
  beforeAll((done) => {
    // First, get auth token for a test user
    request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password123' })
      .then(response => {
        authToken = response.body.token;
        
        // Load CSV test data
        fs.createReadStream('tests/data/order-test-scenarios.csv')
          .pipe(csv())
          .on('data', (row) => {
            // Parse numeric values
            row.userId = parseInt(row.userId);
            row.quantity = parseInt(row.quantity);
            row.price = parseFloat(row.price);
            testScenarios.push(row);
          })
          .on('end', done)
          .on('error', done);
      });
  });

  // Setup test data before each test
  beforeEach(async () => {
    // Reset test user balances
    await query('UPDATE users SET balance = 10000 WHERE id IN (1, 2)');
    
    // Clear existing orders and portfolio
    await query('DELETE FROM orders WHERE user_id IN (1, 2)');
    await query('DELETE FROM portfolio WHERE user_id IN (1, 2)');
    
    // Add some test portfolio positions for sell tests
    await query(`
      INSERT INTO portfolio (user_id, symbol, quantity, average_price) 
      VALUES 
        (1, 'AAPL', 20, 145.00),
        (1, 'GOOGL', 5, 2400.00),
        (1, 'MSFT', 10, 290.00)
    `);
  });

  // Run test for each scenario in CSV
  test.each(testScenarios)(
    '$description',
    async ({ description, userId, symbol, orderType, quantity, price, expectedResult, expectedError }) => {
      const orderData = {
        symbol,
        orderType,
        quantity,
        price,
        orderSubtype: 'MARKET' // Default to market order
      };

      const response = await request(app)
        .post('/api/orders/place')
        .set('Authorization', `Bearer ${authToken}`)
        .send(orderData);

      if (expectedResult === 'success') {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('order');
        expect(response.body.order).toMatchObject({
          symbol,
          order_type: orderType,
          quantity,
          status: expect.stringMatching(/FILLED|OPEN/)
        });
      } else {
        expect(response.status).toBeGreaterThanOrEqual(400);
        expect(response.body).toHaveProperty('error');
        if (expectedError) {
          expect(response.body.error).toContain(expectedError);
        }
      }
    }
  );
});

// Additional test file for unit testing the order service
// tests/unit/orderService.datadriven.test.js
const OrderService = require('../../backend/src/services/orderService');

describe('OrderService Data-Driven Unit Tests', () => {
  let orderService;
  const testScenarios = [];

  beforeAll((done) => {
    orderService = new OrderService();
    
    // Load test scenarios
    fs.createReadStream('tests/data/order-test-scenarios.csv')
      .pipe(csv())
      .on('data', (row) => {
        row.userId = parseInt(row.userId);
        row.quantity = parseInt(row.quantity);
        row.price = parseFloat(row.price);
        testScenarios.push(row);
      })
      .on('end', done);
  });

  test.each(testScenarios)(
    'Unit test: $description',
    async ({ description, userId, symbol, orderType, quantity, price, expectedResult, expectedError }) => {
      // Mock database responses based on test scenario
      if (description.includes('Insufficient balance')) {
        jest.spyOn(orderService, 'checkBalance').mockResolvedValue(false);
      } else if (description.includes('Invalid symbol')) {
        jest.spyOn(orderService, 'validateSymbol').mockResolvedValue(false);
      }

      const orderData = {
        userId,
        symbol,
        orderType,
        quantity,
        price
      };

      if (expectedResult === 'success') {
        const result = await orderService.validateOrder(orderData);
        expect(result.valid).toBe(true);
      } else {
        const result = await orderService.validateOrder(orderData);
        expect(result.valid).toBe(false);
        expect(result.error).toContain(expectedError);
      }
    }
  );
});