// backend/src/controllers/tradingController.js
const { query, getClient } = require('../db/connection');

// Get current market prices
const getMarketPrices = async (req, res) => {
  try {
    const result = await query(
      'SELECT symbol, company_name, current_price, previous_close, day_change_percent FROM market_data ORDER BY symbol'
    );
    
    res.json({
      prices: result.rows,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching market prices:', error);
    res.status(500).json({ 
      error: 'Failed to fetch market prices' 
    });
  }
};

// Place a new order
const placeOrder = async (req, res) => {
  const client = await getClient();
  
  try {
    const { symbol, orderType, quantity, price } = req.body;
    const userId = req.userId;
    
    // Validate input
    if (!symbol || !orderType || !quantity || !price) {
      return res.status(400).json({ 
        error: 'All fields are required' 
      });
    }
    
    if (!['BUY', 'SELL'].includes(orderType)) {
      return res.status(400).json({ 
        error: 'Order type must be BUY or SELL' 
      });
    }
    
    if (quantity <= 0 || price <= 0) {
      return res.status(400).json({ 
        error: 'Quantity and price must be positive' 
      });
    }
    
    // Start transaction
    await client.query('BEGIN');
    
    // Get user's current balance
    const userResult = await client.query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    
    const userBalance = parseFloat(userResult.rows[0].balance);
    
    // For BUY orders, check if user has enough balance
    if (orderType === 'BUY') {
      const totalCost = quantity * price;
      if (totalCost > userBalance) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Insufficient balance',
          required: totalCost,
          available: userBalance
        });
      }
    }
    
    // For SELL orders, check if user has enough shares
    if (orderType === 'SELL') {
      const portfolioResult = await client.query(
        'SELECT quantity FROM portfolio WHERE user_id = $1 AND symbol = $2',
        [userId, symbol]
      );
      
      if (portfolioResult.rows.length === 0 || portfolioResult.rows[0].quantity < quantity) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: 'Insufficient shares to sell' 
        });
      }
    }
    
    // Create order
    const orderResult = await client.query(
      'INSERT INTO orders (user_id, symbol, order_type, quantity, price) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [userId, symbol, orderType, quantity, price]
    );
    
    const order = orderResult.rows[0];
    
    // Execute order immediately (simplified - in real system this would be more complex)
    const marketPriceResult = await client.query(
      'SELECT current_price FROM market_data WHERE symbol = $1',
      [symbol]
    );
    
    const executionPrice = parseFloat(marketPriceResult.rows[0].current_price);
    
    // Create trade record
    await client.query(
      'INSERT INTO trades (order_id, executed_price, executed_quantity) VALUES ($1, $2, $3)',
      [order.id, executionPrice, quantity]
    );
    
    // Update order status
    await client.query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      ['FILLED', order.id]
    );
    
    // Update user balance
    if (orderType === 'BUY') {
      const totalCost = quantity * executionPrice;
      await client.query(
        'UPDATE users SET balance = balance - $1 WHERE id = $2',
        [totalCost, userId]
      );
      
      // Update portfolio
      await client.query(
        `INSERT INTO portfolio (user_id, symbol, quantity, average_price) 
         VALUES ($1, $2, $3, $4) 
         ON CONFLICT (user_id, symbol) 
         DO UPDATE SET 
           quantity = portfolio.quantity + $3,
           average_price = ((portfolio.quantity * portfolio.average_price) + ($3 * $4)) / (portfolio.quantity + $3),
           updated_at = CURRENT_TIMESTAMP`,
        [userId, symbol, quantity, executionPrice]
      );
    } else {
      const totalRevenue = quantity * executionPrice;
      await client.query(
        'UPDATE users SET balance = balance + $1 WHERE id = $2',
        [totalRevenue, userId]
      );
      
      // Update portfolio
      await client.query(
        'UPDATE portfolio SET quantity = quantity - $1, updated_at = CURRENT_TIMESTAMP WHERE user_id = $2 AND symbol = $3',
        [quantity, userId, symbol]
      );
    }
    
    // Commit transaction
    await client.query('COMMIT');
    
    // Enhanced response format combining your existing logic with the simple format
    res.json({
      success: true,
      message: 'Order executed successfully',
      order: {
        id: order.id,
        symbol: order.symbol,
        orderType: order.order_type,
        quantity: parseInt(order.quantity),
        originalPrice: parseFloat(order.price),
        executionPrice: executionPrice,
        status: 'FILLED',
        timestamp: new Date().toISOString(),
        userId: order.user_id,
        totalCost: orderType === 'BUY' ? quantity * executionPrice : -(quantity * executionPrice)
      }
    });
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Order placement error:', error);
    res.status(500).json({ 
      success: false,
      error: 'Failed to place order',
      message: error.message 
    });
  } finally {
    client.release();
  }
};

// Get order history
const getOrderHistory = async (req, res) => {
  try {
    const userId = req.userId;
    
    const result = await query(
      `SELECT o.*, t.executed_price, t.executed_quantity, t.executed_at 
       FROM orders o 
       LEFT JOIN trades t ON o.id = t.order_id 
       WHERE o.user_id = $1 
       ORDER BY o.created_at DESC 
       LIMIT 50`,
      [userId]
    );
    
    res.json({
      orders: result.rows
    });
    
  } catch (error) {
    console.error('Error fetching order history:', error);
    res.status(500).json({ 
      error: 'Failed to fetch order history' 
    });
  }
};

// Get user portfolio
const getPortfolio = async (req, res) => {
  try {
    const userId = req.userId;
    
    // Get user balance
    const userResult = await query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    
    // Get holdings
    const portfolioResult = await query(
      `SELECT p.symbol, p.quantity, p.average_price, m.current_price, m.company_name,
       (p.quantity * m.current_price) as market_value,
       ((m.current_price - p.average_price) * p.quantity) as unrealized_pnl
       FROM portfolio p
       JOIN market_data m ON p.symbol = m.symbol
       WHERE p.user_id = $1 AND p.quantity > 0
       ORDER BY market_value DESC`,
      [userId]
    );
    
    const holdings = portfolioResult.rows;
    const totalMarketValue = holdings.reduce((sum, h) => sum + parseFloat(h.market_value), 0);
    const cashBalance = parseFloat(userResult.rows[0].balance);
    const totalPortfolioValue = cashBalance + totalMarketValue;
    
    res.json({
      portfolio: {
        cashBalance,
        totalMarketValue,
        totalPortfolioValue,
        holdings
      }
    });
    
  } catch (error) {
    console.error('Error fetching portfolio:', error);
    res.status(500).json({ 
      error: 'Failed to fetch portfolio' 
    });
  }
};

module.exports = {
  getMarketPrices,
  placeOrder,
  getOrderHistory,
  getPortfolio
};
