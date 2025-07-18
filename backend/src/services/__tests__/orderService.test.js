// backend/src/services/__tests__/orderService.test.js
const OrderService = require('../orderService');
const { query } = require('../../db/connection');

// Mock dependencies
jest.mock('../../db/connection');

describe('OrderService', () => {
  let orderService;

  beforeEach(() => {
    orderService = new OrderService();
    jest.clearAllMocks();
  });

  describe('placeOrder', () => {
    test('should place market order successfully', async () => {
      // Arrange
      const orderData = {
        userId: 1,
        symbol: 'AAPL',
        orderType: 'BUY',
        orderSubtype: 'MARKET',
        quantity: 10
      };

      query.mockResolvedValueOnce({ rows: [{ balance: 10000 }] }) // User balance
           .mockResolvedValueOnce({ rows: [{ current_price: 150 }] }) // Market price
           .mockResolvedValueOnce({ rows: [{ id: 123, ...orderData }] }); // Order creation

      // Act
      const result = await orderService.placeOrder(orderData);

      // Assert
      expect(result).toMatchObject({
        id: 123,
        status: 'FILLED'
      });
      expect(query).toHaveBeenCalledTimes(3);
    });

    test('should reject order with insufficient balance', async () => {
      // Arrange
      const orderData = {
        userId: 1,
        symbol: 'AAPL',
        orderType: 'BUY',
        orderSubtype: 'MARKET',
        quantity: 1000
      };

      query.mockResolvedValueOnce({ rows: [{ balance: 100 }] }) // Low balance
           .mockResolvedValueOnce({ rows: [{ current_price: 150 }] }); // Market price

      // Act & Assert
      await expect(orderService.placeOrder(orderData))
        .rejects.toThrow('Insufficient balance');
    });
  });

  describe('Order Matching Engine', () => {
    test('should match buy and sell orders at same price', async () => {
      // Test implementation
    });
  });
});