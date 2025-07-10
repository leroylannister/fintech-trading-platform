// backend/src/services/complianceService.js
const { query } = require('../db/connection');

class ComplianceService {
  // Log all trading activities
  async logActivity(userId, activityType, details) {
    try {
      await query(
        `INSERT INTO audit_log (user_id, activity_type, details, ip_address, timestamp)
         VALUES ($1, $2, $3, $4, CURRENT_TIMESTAMP)`,
        [userId, activityType, JSON.stringify(details), details.ipAddress || 'unknown']
      );
    } catch (error) {
      console.error('Failed to log activity:', error);
    }
  }

  // Check for suspicious trading patterns
  async checkSuspiciousActivity(userId, orderDetails) {
    const checks = [];
    
    // Check 1: High frequency trading
    const recentOrdersResult = await query(
      `SELECT COUNT(*) as order_count 
       FROM orders 
       WHERE user_id = $1 
       AND created_at > NOW() - INTERVAL '1 minute'`,
      [userId]
    );
    
    if (recentOrdersResult.rows[0].order_count > 10) {
      checks.push({
        type: 'HIGH_FREQUENCY_TRADING',
        severity: 'WARNING',
        message: 'More than 10 orders placed in 1 minute'
      });
    }
    
    // Check 2: Large order relative to account balance
    const userResult = await query(
      'SELECT balance FROM users WHERE id = $1',
      [userId]
    );
    
    const orderValue = orderDetails.quantity * orderDetails.price;
    const balance = parseFloat(userResult.rows[0].balance);
    
    if (orderValue > balance * 0.5) {
      checks.push({
        type: 'LARGE_ORDER',
        severity: 'WARNING',
        message: 'Order value exceeds 50% of account balance'
      });
    }
    
    // Check 3: Pattern day trading (simplified)
    const dayTradingResult = await query(
      `SELECT COUNT(DISTINCT symbol) as symbols_traded
       FROM orders
       WHERE user_id = $1
       AND created_at > NOW() - INTERVAL '1 day'
       AND status = 'FILLED'`,
      [userId]
    );
    
    if (dayTradingResult.rows[0].symbols_traded > 4) {
      checks.push({
        type: 'PATTERN_DAY_TRADING',
        severity: 'INFO',
        message: 'User has traded more than 4 different symbols today'
      });
    }
    
    return checks;
  }

  // Generate compliance report
  async generateComplianceReport(startDate, endDate) {
    const report = {
      period: { startDate, endDate },
      generatedAt: new Date().toISOString(),
      summary: {},
      details: []
    };
    
    // Total trades
    const tradesResult = await query(
      `SELECT COUNT(*) as total_trades, 
              SUM(executed_price * executed_quantity) as total_volume
       FROM trades t
       JOIN orders o ON t.order_id = o.id
       WHERE t.executed_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    
    report.summary.totalTrades = tradesResult.rows[0].total_trades;
    report.summary.totalVolume = tradesResult.rows[0].total_volume;
    
    // Active users
    const usersResult = await query(
      `SELECT COUNT(DISTINCT user_id) as active_users
       FROM orders
       WHERE created_at BETWEEN $1 AND $2`,
      [startDate, endDate]
    );
    
    report.summary.activeUsers = usersResult.rows[0].active_users;
    
    // Suspicious activities
    const suspiciousResult = await query(
      `SELECT * FROM audit_log
       WHERE activity_type LIKE '%SUSPICIOUS%'
       AND timestamp BETWEEN $1 AND $2
       ORDER BY timestamp DESC`,
      [startDate, endDate]
    );
    
    report.details.suspiciousActivities = suspiciousResult.rows;
    
    return report;
  }

  // Check position limits
  async checkPositionLimits(userId, symbol, orderQuantity) {
    // Get current position
    const positionResult = await query(
      'SELECT quantity FROM portfolio WHERE user_id = $1 AND symbol = $2',
      [userId, symbol]
    );
    
    const currentPosition = positionResult.rows[0]?.quantity || 0;
    const newPosition = currentPosition + orderQuantity;
    
    // Simple position limit: max 1000 shares per symbol
    const POSITION_LIMIT = 1000;
    
    if (Math.abs(newPosition) > POSITION_LIMIT) {
      return {
        allowed: false,
        reason: `Position limit exceeded. Maximum allowed: ${POSITION_LIMIT} shares`,
        currentPosition,
        requestedPosition: newPosition
      };
    }
    
    return { allowed: true };
  }
}

// Create audit log table
const createAuditTable = `
CREATE TABLE IF NOT EXISTS audit_log (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    activity_type VARCHAR(100) NOT NULL,
    details JSONB,
    ip_address VARCHAR(45),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX idx_audit_log_timestamp ON audit_log(timestamp);
CREATE INDEX idx_audit_log_activity_type ON audit_log(activity_type);
`;

module.exports = { ComplianceService, createAuditTable };