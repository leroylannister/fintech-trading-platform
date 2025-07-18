// tests/contracts/consumer/trading-service.pact.test.js
const { Pact } = require('@pact-foundation/pact');
const { like, term } = require('@pact-foundation/pact/dsl/matchers');
const path = require('path');
const { TradingServiceClient } = require('../../../services/trading-service/client');

const provider = new Pact({
  consumer: 'TradingService',
  provider: 'MarketDataService',
  port: 8992,
  log: path.resolve(process.cwd(), 'logs', 'pact.log'),
  dir: path.resolve(process.cwd(), 'pacts'),
  spec: 2
});

describe('Trading Service Consumer Tests', () => {
  beforeAll(() => provider.setup());
  afterAll(() => provider.finalize());
  afterEach(() => provider.verify());

  describe('get market price', () => {
    test('should receive current market price', async () => {
      // Arrange
      await provider.addInteraction({
        state: 'AAPL has a market price',
        uponReceiving: 'a request for AAPL price',
        withRequest: {
          method: 'GET',
          path: '/api/market/price/AAPL',
          headers: {
            Accept: 'application/json'
          }
        },
        willRespondWith: {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          body: {
            symbol: 'AAPL',
            price: like(150.50),
            timestamp: term({
              generate: '2023-01-01T12:00:00Z',
              matcher: '\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}Z'
            })
          }
        }
      });

      // Act
      const client = new TradingServiceClient(provider.mockService.baseUrl);
      const price = await client.getMarketPrice('AAPL');

      // Assert
      expect(price).toHaveProperty('symbol', 'AAPL');
      expect(price).toHaveProperty('price');
      expect(typeof price.price).toBe('number');
    });
  });
});