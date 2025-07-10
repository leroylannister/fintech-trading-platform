// backend/src/routes/index.js
const express = require('express');
const { register, login } = require('../controllers/authController');
const { 
  getMarketPrices, 
  placeOrder, 
  getOrderHistory, 
  getPortfolio 
} = require('../controllers/tradingController');
const { authenticateToken } = require('../middleware/auth');

const router = express.Router();

// Authentication routes (public)
router.post('/auth/register', register);
router.post('/auth/login', login);

// Market data routes (public for simplicity)
router.get('/market/prices', getMarketPrices);

// Protected trading routes
router.post('/orders/place', authenticateToken, placeOrder);
router.get('/orders/history', authenticateToken, getOrderHistory);
router.get('/portfolio', authenticateToken, getPortfolio);

module.exports = router;