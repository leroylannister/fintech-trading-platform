// backend/src/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const MarketSimulator = require('./services/marketSimulator');
const { ComplianceService } = require('./services/complianceService');
const webSocketService = require('./services/websocketService');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize services
const marketSimulator = new MarketSimulator();
const complianceService = new ComplianceService();

// Middleware
app.use(cors());
app.use(express.json());

// Import routes
const routes = require('./routes');

// Basic health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString() 
  });
});

// Use API routes
app.use('/api', routes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    error: 'Something went wrong!',
    message: err.message 
  });
});

// Create HTTP server
const server = http.createServer(app);

// Initialize WebSocket
webSocketService.initialize(server);

// Update market simulator to broadcast updates
if (marketSimulator) {
  marketSimulator.onPriceUpdate = (symbol, price) => {
    webSocketService.broadcastMarketUpdate(symbol, { price });
  };
}

// Start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  
  // Start market simulator
  if (process.env.NODE_ENV !== 'test') {
    marketSimulator.start();
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  marketSimulator.stop();
  server.close(() => {
    console.log('HTTP server closed');
  });
});

module.exports = app;