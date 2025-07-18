// backend/src/services/orderService.js
class OrderService {
  constructor() {
    this.orderTypes = {
      MARKET: this.processMarketOrder,
      LIMIT: this.processLimitOrder,
      STOP_LOSS: this.processStopLossOrder,
      STOP_LIMIT: this.processStopLimitOrder
    };
  }

  async placeOrder(orderData) {
    const { orderSubtype = 'MARKET' } = orderData;
    
    // Validate order
    const validation = await this.validateOrder(orderData);
    if (!validation.valid) {
      throw new Error(validation.message);
    }

    // Process based on order type
    const processor = this.orderTypes[orderSubtype];
    if (!processor) {
      throw new Error(`Unknown order type: ${orderSubtype}`);
    }

    return await processor.call(this, orderData);
  }

  async processMarketOrder(orderData) {
    const { symbol, orderType, quantity, userId } = orderData;
    
    // Get current market price
    const marketPrice = await this.getMarketPrice(symbol);
    
    // Execute immediately at market price
    return await this.executeOrder({
      ...orderData,
      price: marketPrice,
      status: 'FILLED'
    });
  }

  async processLimitOrder(orderData) {
    const { symbol, orderType, quantity, limitPrice, userId } = orderData;
    
    // Check if order can be filled immediately
    const canFill = await this.checkImmediateFill(symbol, orderType, limitPrice);
    
    if (canFill) {
      return await this.executeOrder({
        ...orderData,
        price: limitPrice,
        status: 'FILLED'
      });
    } else {
      // Add to order book
      return await this.addToOrderBook(orderData);
    }
  }

  async processStopLossOrder(orderData) {
    const { symbol, orderType, quantity, stopPrice, userId } = orderData;
    
    // Create pending stop order
    const order = await this.createOrder({
      ...orderData,
      status: 'PENDING_STOP'
    });

    // Monitor price for trigger
    this.monitorStopOrder(order);
    
    return order;
  }

  async addToOrderBook(orderData) {
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (user_id, symbol, order_type, order_subtype, quantity, price, limit_price, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, 'OPEN')
         RETURNING *`,
        [orderData.userId, orderData.symbol, orderData.orderType, orderData.orderSubtype, 
         orderData.quantity, orderData.price, orderData.limitPrice]
      );
      
      const order = orderResult.rows[0];
      
      // Add to order book
      await client.query(
        `INSERT INTO order_book (symbol, side, price, quantity, order_id)
         VALUES ($1, $2, $3, $4, $5)`,
        [orderData.symbol, orderData.orderType, orderData.limitPrice, orderData.quantity, order.id]
      );
      
      await client.query('COMMIT');
      
      // Try to match orders
      await this.matchOrders(orderData.symbol);
      
      return order;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}