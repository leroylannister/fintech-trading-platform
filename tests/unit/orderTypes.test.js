// tests/unit/orderTypes.test.js
describe('Advanced Order Types', () => {
  describe('Limit Orders', () => {
    test('should add to order book when price not met', async () => {
      const order = {
        symbol: 'AAPL',
        orderType: 'BUY',
        orderSubtype: 'LIMIT',
        quantity: 10,
        limitPrice: 140.00
      };
      
      const result = await orderService.placeOrder(order);
      expect(result.status).toBe('OPEN');
      
      // Check order book
      const orderBook = await getOrderBook('AAPL');
      expect(orderBook.buy.length).toBeGreaterThan(0);
    });
    
    test('should execute immediately when price is met', async () => {
      const order = {
        symbol: 'AAPL',
        orderType: 'BUY',
        orderSubtype: 'LIMIT',
        quantity: 10,
        limitPrice: 160.00 // Above market price
      };
      
      const result = await orderService.placeOrder(order);
      expect(result.status).toBe('FILLED');
    });
  });
});