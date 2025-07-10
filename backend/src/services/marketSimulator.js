// backend/src/services/marketSimulator.js
const { query } = require('../db/connection');

class MarketSimulator {
  constructor() {
    this.symbols = ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'];
    this.volatility = 0.02; // 2% volatility
    this.updateInterval = process.env.MARKET_UPDATE_INTERVAL || 5000;
  }

  // Generate random price movement
  generatePriceChange(currentPrice) {
    const changePercent = (Math.random() - 0.5) * this.volatility;
    const newPrice = currentPrice * (1 + changePercent);
    return Math.round(newPrice * 100) / 100; // Round to 2 decimal places
  }

  // Update market prices
  async updateMarketPrices() {
    try {
      const result = await query('SELECT symbol, current_price FROM market_data');
      
      for (const stock of result.rows) {
        const newPrice = this.generatePriceChange(stock.current_price);
        const changePercent = ((newPrice - stock.current_price) / stock.current_price * 100).toFixed(2);
        
        await query(
          `UPDATE market_data 
           SET previous_close = current_price,
               current_price = $1,
               day_change_percent = $2,
               last_updated = CURRENT_TIMESTAMP
           WHERE symbol = $3`,
          [newPrice, changePercent, stock.symbol]
        );
        
        console.log(`Updated ${stock.symbol}: $${stock.current_price} → $${newPrice} (${changePercent}%)`);
      }
    } catch (error) {
      console.error('Error updating market prices:', error);
    }
  }

  // Start the simulator
  start() {
    console.log(`Market simulator started (updating every ${this.updateInterval}ms)`);
    
    // Initial update
    this.updateMarketPrices();
    
    // Schedule regular updates
    this.intervalId = setInterval(() => {
      this.updateMarketPrices();
    }, this.updateInterval);
  }

  // Stop the simulator
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      console.log('Market simulator stopped');
    }
  }
}

module.exports = MarketSimulator;