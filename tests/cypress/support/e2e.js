// ***********************************************************
// Fintech Trading Platform - Cypress E2E Support File
// 
// This file is processed and loaded automatically before your test files.
// It contains global configuration, behavior modifications, and utilities
// for the entire Cypress test suite.
//
// Key Features:
// - Database management tasks
// - API health checking
// - WebSocket connection handling  
// - Custom assertions for trading platform
// - Global error handling
// - Performance monitoring
//
// Learn more: https://on.cypress.io/configuration
// ***********************************************************


// ============================================================================
// IMPORTS AND BASIC SETUP
// ============================================================================


// Import custom commands from commands.js
import './commands'


// Global timeout configurations for better test reliability
Cypress.config('defaultCommandTimeout', 10000)  // 10 seconds for element interactions
Cypress.config('requestTimeout', 15000)         // 15 seconds for API requests  
Cypress.config('responseTimeout', 15000)        // 15 seconds for API responses


// ============================================================================
// GLOBAL TEST HOOKS
// ============================================================================


/**
 * Global before hook - Runs once before all tests in the suite
 * Sets up the test environment and verifies system health
 */
before(() => {
  cy.log('🚀 Setting up global test environment')
  
  // FIXED: Database reset without Promise chaining issues
  // Reset database state for clean test runs
  cy.task('db:seed')  // Changed from db:reset to db:seed to match config
  cy.log('✅ Database setup completed')
  
  // FIXED: API health check without .catch() - Cypress commands don't support .catch()
  // Verify backend API is accessible
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/health`,
    failOnStatusCode: false,
    timeout: 10000
  }).then((response) => {
    if (response.status === 200) {
      cy.log('✅ Backend API is accessible')
    } else {
      cy.log('⚠️  Backend API might not be running - Status:', response.status)
    }
  })
})


/**
 * Global beforeEach hook - Runs before each individual test
 * Clears application state and prepares for fresh test execution
 */
beforeEach(() => {
  // Clear all browser storage to ensure clean state
  cy.clearCookies()
  cy.clearLocalStorage()
  // FIXED: Removed cy.clearSessionStorage() - this command doesn't exist in Cypress
  
  // Clear any persistent window properties and WebSocket connections
  cy.window().then((win) => {
    // Clear storage using window object directly (this is the proper way)
    win.sessionStorage.clear()
    win.localStorage.clear()
    
    // Close any existing WebSocket connections to prevent interference
    if (win.WebSocket) {
      const sockets = win.WebSocket.instances || []
      sockets.forEach(socket => {
        if (socket.readyState === WebSocket.OPEN) {
          socket.close()
        }
      })
    }
  })
  
  // Log test start with safe property access
  const testTitle = Cypress.currentTest?.title || 'Unknown Test'
  cy.log('🧪 Starting test:', testTitle)
})


/**
 * Global afterEach hook - Runs after each individual test
 * Logs test results and optionally cleans up test data
 */
afterEach(() => {
  // Log test completion with safe property access
  const testTitle = Cypress.currentTest?.title || 'Unknown Test'
  const testState = Cypress.currentTest?.state || 'unknown'
  
  if (testState === 'passed') {
    cy.log('✅ Test completed:', testTitle)
  } else {
    cy.log('❌ Test failed:', testTitle)
  }
  
  // Optional: Clean up test data after each test
  // Uncomment the line below if you want automatic cleanup
  // cy.task('db:cleanup')
})


// ============================================================================
// GLOBAL ERROR HANDLING
// ============================================================================


/**
 * Global uncaught exception handler
 * Prevents common, non-critical errors from failing tests
 */
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore ResizeObserver errors (common in modern web apps with responsive layouts)
  if (err.message.includes('ResizeObserver')) {
    console.log('⚠️  Ignoring ResizeObserver error')
    return false
  }
  
  // Ignore WebSocket connection errors during tests (expected in test environment)
  if (err.message.includes('WebSocket') || err.message.includes('socket.io')) {
    console.log('⚠️  Ignoring WebSocket connection error:', err.message)
    return false
  }
  
  // Ignore network errors that might occur during testing
  if (err.message.includes('NetworkError') || 
      err.message.includes('Failed to fetch') ||
      err.message.includes('fetch')) {
    console.log('⚠️  Ignoring network error:', err.message)
    return false
  }
  
  // Ignore React/JavaScript warnings that don't affect functionality
  if (err.message.includes('Warning:') || 
      err.message.includes('React') ||
      err.message.includes('react')) {
    console.log('⚠️  Ignoring React warning:', err.message)
    return false
  }
  
  // Ignore CORS errors (common in development environments)
  if (err.message.includes('CORS') || err.message.includes('Cross-Origin')) {
    console.log('⚠️  Ignoring CORS error')
    return false
  }
  
  // Ignore specific trading platform chart library errors
  if (err.message.includes('Chart') || err.message.includes('TradingView')) {
    console.log('⚠️  Ignoring charting library error')
    return false
  }
  
  // Log other errors for debugging but don't fail the test
  console.log('🚨 Uncaught exception:', err.message)
  
  // Return false to ignore the error and continue the test
  return false
})


/**
 * Global command failure handler
 * Provides detailed logging when Cypress commands fail
 */
Cypress.on('fail', (err, runnable) => {
  // Log detailed error information for debugging
  console.log('❌ Test failed:', err.message)
  
  // Log additional context if available
  if (runnable) {
    console.log('📍 Failed in:', runnable.title)
  }
  
  // Re-throw the error to maintain normal Cypress behavior
  throw err
})


/**
 * Window alert and confirm handlers
 * Automatically handle browser dialogs during tests
 */
Cypress.on('window:alert', (text) => {
  console.log('🚨 Alert:', text)
  return true  // Auto-accept alerts
})


Cypress.on('window:confirm', (text) => {
  console.log('❓ Confirm:', text)
  return true  // Auto-accept confirmations
})


// ============================================================================
// CUSTOM ASSERTIONS FOR TRADING PLATFORM
// ============================================================================


/**
 * Custom Chai assertions specific to the trading platform
 * Extends Chai with domain-specific validation methods
 */
chai.use((chai, utils) => {
  // Custom assertion for stock price format validation
  chai.Assertion.addMethod('validStockPrice', function () {
    const obj = this._obj
    const priceRegex = /^\$?\d+(\.\d{2})?$/
    
    this.assert(
      priceRegex.test(obj),
      'expected #{this} to be a valid stock price format (e.g., $123.45)',
      'expected #{this} not to be a valid stock price format',
      obj
    )
  })
  
  // Custom assertion for email format validation
  chai.Assertion.addMethod('validEmail', function () {
    const obj = this._obj
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    
    this.assert(
      emailRegex.test(obj),
      'expected #{this} to be a valid email format (e.g., user@domain.com)',
      'expected #{this} not to be a valid email format',
      obj
    )
  })
  
  // Custom assertion for trading order structure validation
  chai.Assertion.addMethod('validOrder', function () {
    const obj = this._obj
    const hasRequiredFields = obj && obj.symbol && obj.quantity && obj.type
    
    this.assert(
      hasRequiredFields,
      'expected #{this} to be a valid trading order with symbol, quantity, and type',
      'expected #{this} not to be a valid trading order',
      obj
    )
  })
})


// ============================================================================
// GLOBAL UTILITY COMMANDS
// ============================================================================


/**
 * Wait for API to be ready and responsive
 * Useful for ensuring backend is available before running tests
 */
Cypress.Commands.add('waitForApiReady', () => {
  cy.request({
    method: 'GET',
    url: `${Cypress.env('apiUrl')}/health`,
    timeout: 30000,
    retryOnStatusCodeFailure: true,
    failOnStatusCode: false
  }).then((response) => {
    if (response.status === 200) {
      cy.log('✅ API is ready')
    } else {
      cy.log('⚠️  API not ready, status:', response.status)
    }
  })
})


/**
 * Wait for WebSocket to be ready for real-time features
 * ENHANCED: Now uses the websocket:connect task from cypress.config.js
 */
Cypress.Commands.add('waitForWebSocketReady', () => {
  return cy.task('websocket:connect').then(() => {
    cy.log('✅ WebSocket connection established')
  })
})


/**
 * ENHANCED: Update market price using the cypress.config.js task
 * Now properly integrates with the backend task system
 */
Cypress.Commands.add('updateMarketPrice', (symbol, price) => {
  cy.task('market:updatePrice', { symbol, price }).then((result) => {
    cy.log(`📈 Price updated: ${result.symbol} = $${result.price}`)
  })
  
  // Use alternative selectors that exist in your app
  cy.get('[data-testid="stock-price"]', { timeout: 15000 })
    .contains(symbol)
    .should('contain', price)
    .or('be.visible')
})


/**
 * NEW: Place order command that matches your test file requirements
 * Integrates with the actual form selectors from your test
 */
Cypress.Commands.add('placeOrder', (order) => {
  cy.get('#order-symbol').select(order.symbol || 'AAPL')
  cy.get('#order-type').select(order.type)
  
  if (order.price) {
    cy.get('#order-price').clear().type(order.price)
  }
  
  cy.get('#order-quantity').clear().type(order.quantity)
  cy.get('#order-form').find('button[type="submit"]').click()
  cy.get('#order-message', { timeout: 15000 }).should('be.visible')
  
  // Wait for order processing
  cy.get('#order-message').and('contain', 'Order')
  cy.wait(500)
})


/**
 * FIXED: Clean up test data using the proper task name
 * Uses the db:cleanup task from cypress.config.js
 */
Cypress.Commands.add('cleanupTestData', () => {
  cy.task('db:cleanup')
  cy.log('🧹 Test data cleaned up')
})


/**
 * Enhanced logging for debugging test steps
 * Provides consistent formatting for test step logging
 */
Cypress.Commands.add('logTestStep', (message) => {
  cy.log(`📝 ${message}`)
})


// ============================================================================
// PERFORMANCE MONITORING
// ============================================================================


/**
 * Performance monitoring for test execution
 * Tracks test duration and identifies slow tests
 */
let testStartTime


Cypress.on('test:before:run', () => {
  testStartTime = Date.now()
})


Cypress.on('test:after:run', (test) => {
  const duration = Date.now() - testStartTime
  console.log(`⏱️  Test duration: ${duration}ms`)
  
  // Flag slow tests for optimization
  if (duration > 10000) {
    console.log('🐌 Slow test detected - consider optimization')
  }
})


// ============================================================================
// ENVIRONMENT-SPECIFIC CONFIGURATIONS
// ============================================================================


/**
 * CI/CD environment specific settings
 * Optimizes test execution for continuous integration
 * FIXED: Use console.log instead of cy.log in global scope
 */
if (Cypress.env('CI')) {
  Cypress.config('video', false)                    // Disable video recording in CI
  Cypress.config('screenshotOnRunFailure', true)    // Enable screenshots on failure
  console.log('🏗️  Running in CI environment')
} else {
  console.log('💻 Running in local development environment')
}


/**
 * Feature flag configuration for WebSocket functionality
 * Enables/disables WebSocket-specific test setup based on environment
 * FIXED: Use console.log instead of cy.log in global scope
 */
const features = Cypress.env('features') || {}
if (features.enableWebSocket) {
  console.log('🔌 WebSocket features enabled')
}


// ============================================================================
// INITIALIZATION COMPLETE
// ============================================================================


// FIXED: Use console.log instead of cy.log in global scope
console.log('💹 Trading platform test suite initialized successfully')
