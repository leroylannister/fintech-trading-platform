const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.js',
    videosFolder: 'cypress/videos',
    screenshotsFolder: 'cypress/screenshots',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    
    // Enhanced timeout settings for trading platform
    defaultCommandTimeout: 10000,
    requestTimeout: 15000,
    responseTimeout: 15000,
    pageLoadTimeout: 30000,
    
    // Better error handling and security
    failOnStatusCode: false,
    chromeWebSecurity: false,
    
    // Additional stability settings
    experimentalStudio: true,
    retries: {
      runMode: 2,
      openMode: 0
    },
    
    setupNodeEvents(on, config) {
      // ENHANCED: Database management tasks with better implementation
      on('task', {
        'db:seed': () => {
          console.log('🌱 Seeding database with trading data...')
          // TODO: Add your actual database seeding logic here
          // Example: seedTradingData()
          // This should create:
          // - Test users with various portfolios
          // - Stock symbols with initial prices
          // - Sample order history
          // - Market data snapshots
          return null
        },
        'db:clean': () => {
          console.log('🧹 Cleaning test trading data...')
          // TODO: Add your database cleanup logic here
          // Example: cleanTestData()
          // This should remove:
          // - Test user accounts
          // - Test orders and portfolios
          // - Temporary market data
          return null
        },
        'db:reset': () => {
          console.log('🔄 Resetting trading database to initial state...')
          // TODO: Add your database reset logic here
          // Example: resetTradingDatabase()
          // This should:
          // - Clear all test data
          // - Restore initial market prices
          // - Reset user balances
          return null
        },
        
        // FIXED: Added missing market update task for WebSocket testing
        'market:updatePrice': ({ symbol, price }) => {
          console.log(`📈 Updating ${symbol} price to $${price}`)
          // TODO: Add your market price update logic here
          // This might involve:
          // - Calling your WebSocket server
          // - Updating database with new price
          // - Broadcasting to connected clients
          // Example: updateMarketPrice(symbol, price)
          return null
        },
        
        // ENHANCED: Additional trading-specific tasks
        'trading:createOrder': ({ symbol, type, quantity, price, userId }) => {
          console.log(`📋 Creating ${type} order: ${quantity} ${symbol} @ $${price}`)
          // TODO: Add order creation logic
          // Example: createTestOrder({ symbol, type, quantity, price, userId })
          return null
        },
        
        'trading:cancelOrder': ({ orderId }) => {
          console.log(`❌ Canceling order: ${orderId}`)
          // TODO: Add order cancellation logic
          // Example: cancelTestOrder(orderId)
          return null
        },
        
        'trading:updatePortfolio': ({ userId, symbol, quantity, action }) => {
          console.log(`💼 Updating portfolio for user ${userId}: ${action} ${quantity} ${symbol}`)
          // TODO: Add portfolio update logic
          // Example: updateTestPortfolio({ userId, symbol, quantity, action })
          return null
        },
        
        // ENHANCED: WebSocket connection management
        'websocket:connect': ({ userId }) => {
          console.log(`🔌 Establishing WebSocket connection for user ${userId}`)
          // TODO: Add WebSocket connection logic
          // Example: connectWebSocketClient(userId)
          return null
        },
        
        'websocket:disconnect': ({ userId }) => {
          console.log(`🔌 Disconnecting WebSocket for user ${userId}`)
          // TODO: Add WebSocket disconnection logic
          // Example: disconnectWebSocketClient(userId)
          return null
        },
        
        // ENHANCED: API health check with more details
        'api:health': () => {
          console.log('🏥 Checking API health...')
          // TODO: Add comprehensive API health check
          // Example: checkAPIHealth()
          // This should verify:
          // - Database connectivity
          // - WebSocket server status
          // - Market data feed availability
          return null
        },
        
        // ENHANCED: Market data simulation
        'market:simulate': ({ scenario }) => {
          console.log(`🎭 Simulating market scenario: ${scenario}`)
          // TODO: Add market simulation logic
          // Example: simulateMarketScenario(scenario)
          // Scenarios might include:
          // - 'bull_market', 'bear_market', 'volatile'
          // - 'market_open', 'market_close', 'after_hours'
          return null
        }
      })
      
      // ENHANCED: Browser launch optimizations with trading platform considerations
      on('before:browser:launch', (browser = {}, launchOptions) => {
        console.log('🚀 Launching browser for trading platform tests:', browser.name)
        
        if (browser.name === 'chrome') {
          launchOptions.args.push('--disable-dev-shm-usage')
          launchOptions.args.push('--no-sandbox')
          launchOptions.args.push('--disable-gpu')
          launchOptions.args.push('--disable-web-security')
          
          // ENHANCED: Additional Chrome flags for trading platform
          launchOptions.args.push('--disable-features=VizDisplayCompositor')
          launchOptions.args.push('--disable-background-timer-throttling')
          launchOptions.args.push('--disable-backgrounding-occluded-windows')
          launchOptions.args.push('--disable-renderer-backgrounding')
          
          // Allow WebSocket connections
          launchOptions.args.push('--disable-background-networking')
        }
        
        return launchOptions
      })
      
      // ENHANCED: Test execution logging with trading-specific metrics
      on('before:run', (details) => {
        console.log('🎯 Starting trading platform test run...')
        console.log('Browser:', details.browser.name)
        console.log('Specs:', details.specs.length)
        console.log('Trading features enabled:', config.env.features.enableAdvancedTrading)
        console.log('WebSocket enabled:', config.env.features.enableWebSocket)
      })
      
      on('after:run', (results) => {
        console.log('✅ Trading platform test run completed')
        console.log('Total tests:', results.totalTests)
        console.log('Passed:', results.totalPassed)
        console.log('Failed:', results.totalFailed)
        console.log('Duration:', results.totalDuration, 'ms')
        
        // ENHANCED: Trading-specific test metrics
        const successRate = results.totalTests > 0 ? 
          ((results.totalPassed / results.totalTests) * 100).toFixed(1) : 0
        console.log('Success rate:', successRate + '%')
        
        if (results.totalFailed > 0) {
          console.log('⚠️  Some trading platform tests failed - check logs for details')
        }
      })
      
      // ENHANCED: Spec-level logging for better debugging
      on('before:spec', (spec) => {
        console.log(`📋 Running spec: ${spec.name}`)
      })
      
      on('after:spec', (spec, results) => {
        console.log(`📊 Spec ${spec.name} completed:`, {
          tests: results.tests,
          passes: results.passes,
          failures: results.failures
        })
      })
      
      // Important: DO NOT register 'uncaught:exception' here
      // It should be handled in cypress/support/e2e.js
      
      return config
    },
    
    env: {
      apiUrl: 'http://localhost:3000/api',
      testUser: {
        email: 'test@example.com',
        password: 'password123'
      },
      
      // ENHANCED: Trading platform feature flags
      features: {
        enableWebSocket: true,
        enableAdvancedTrading: true,
        enableRealTimeUpdates: true,
        enableOrderBook: true,
        enablePortfolioTracking: true,
        enableMarketSimulation: true
      },
      
      // ENHANCED: Test data configuration
      testData: {
        defaultBalance: 10000,
        testSymbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA'],
        orderTypes: ['MARKET', 'LIMIT', 'STOP', 'STOP_LIMIT'],
        tradingHours: {
          open: '09:30',
          close: '16:00',
          timezone: 'America/New_York'
        },
        testUsers: [
          {
            email: 'trader1@example.com',
            password: 'password123',
            balance: 50000,
            role: 'premium_trader'
          },
          {
            email: 'trader2@example.com',
            password: 'password123',
            balance: 10000,
            role: 'basic_trader'
          }
        ]
      },
      
      // ENHANCED: WebSocket configuration
      websocket: {
        url: 'ws://localhost:3000',
        connectionTimeout: 10000,
        heartbeatInterval: 30000,
        reconnectAttempts: 3,
        subscriptions: [
          'market_data',
          'order_updates',
          'portfolio_updates'
        ]
      },
      
      // ENHANCED: API configuration
      api: {
        timeout: 15000,
        retries: 3,
        endpoints: {
          auth: '/auth',
          trading: '/trading',
          market: '/market',
          portfolio: '/portfolio',
          orders: '/orders'
        }
      }
    }
  }
});
