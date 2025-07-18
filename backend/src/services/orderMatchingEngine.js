// backend/src/services/orderMatchingEngine.js
class OrderMatchingEngine {
  async matchOrders(symbol) {
    const client = await getClient();
    
    try {
      // Get buy and sell orders from order book
      const buyOrders = await client.query(
        `SELECT * FROM order_book 
         WHERE symbol = $1 AND side = 'BUY' 
         ORDER BY price DESC, created_at ASC`,
        [symbol]
      );
      
      const sellOrders = await client.query(
        `SELECT * FROM order_book 
         WHERE symbol = $1 AND side = 'SELL' 
         ORDER BY price ASC, created_at ASC`,
        [symbol]
      );
      
      // Match orders
      for (const buyOrder of buyOrders.rows) {
        for (const sellOrder of sellOrders.rows) {
          if (buyOrder.price >= sellOrder.price) {
            await this.executeMatch(buyOrder, sellOrder);
          }
        }
      }
    } catch (error) {
      console.error('Order matching error:', error);
    } finally {
      client.release();
    }
  }

  async executeMatch(buyOrder, sellOrder) {
    const matchedQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
    const matchedPrice = sellOrder.price; // Price-time priority
    
    const client = await getClient();
    
    try {
      await client.query('BEGIN');
      
      // Record the match
      await client.query(
        `INSERT INTO order_matches (buy_order_id, sell_order_id, matched_price, matched_quantity)
         VALUES ($1, $2, $3, $4)`,
        [buyOrder.order_id, sellOrder.order_id, matchedPrice, matchedQuantity]
      );
      
      // Update order quantities
      if (buyOrder.quantity === matchedQuantity) {
        // Fully filled
        await client.query(
          'DELETE FROM order_book WHERE id = $1',
          [buyOrder.id]
        );
        await client.query(
          "UPDATE orders SET status = 'FILLED' WHERE id = $1",
          [buyOrder.order_id]
        );
      } else {
        // Partially filled
        await client.query(
          'UPDATE order_book SET quantity = quantity - $1 WHERE id = $2',
          [matchedQuantity, buyOrder.id]
        );
      }
      
      // Same for sell order
      if (sellOrder.quantity === matchedQuantity) {
        await client.query(
          'DELETE FROM order_book WHERE id = $1',
          [sellOrder.id]
        );
        await client.query(
          "UPDATE orders SET status = 'FILLED' WHERE id = $1",
          [sellOrder.order_id]
        );
      } else {
        await client.query(
          'UPDATE order_book SET quantity = quantity - $1 WHERE id = $2',
          [matchedQuantity, sellOrder.id]
        );
      }
      
      // Execute trades
      await this.executeTrades(buyOrder.order_id, sellOrder.order_id, matchedPrice, matchedQuantity);
      
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}