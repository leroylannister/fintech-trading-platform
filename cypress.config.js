// tests/cypress.config.js

const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: 'http://localhost:8080',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    supportFile: 'tests/cypress/support/e2e.js',
    
    setupNodeEvents(on, config) {
      // Database seeding task
      on('task', {
        'db:seed': () => {
          // Implement your database seeding logic here
          console.log('🌱 Seeding test database...');
          
          // Example: Reset and populate test data
          // You can use your actual database seeding logic
          return new Promise((resolve) => {
            // Simulate database seeding
            setTimeout(() => {
              console.log('✅ Database seeded successfully');
              resolve(null);
            }, 1000);
          });
        },

        // Market price update task for WebSocket simulation
        'market:updatePrice': ({ symbol, price }) => {
          console.log(`📈 Updating ${symbol} price to $${price}`);
          
          // Simulate market price update
          // In a real implementation, this would:
          // 1. Update your test database
          // 2. Trigger WebSocket events to connected clients
          // 3. Or make API calls to your backend
          
          return new Promise((resolve) => {
            // Simulate price update delay
            setTimeout(() => {
              console.log(`✅ Price updated: ${symbol} = $${price}`);
              resolve({ symbol, price, timestamp: new Date().toISOString() });
            }, 500);
          });
        },

        // WebSocket connection helper
        'websocket:connect': () => {
          console.log('🔌 Establishing WebSocket connection...');
          return new Promise((resolve) => {
            setTimeout(() => {
              console.log('✅ WebSocket connected');
              resolve(true);
            }, 1000);
          });
        },

        // WebSocket load test task - UPDATED
        'websocket:loadTest': async (config) => {
          console.log('🧪 Running WebSocket performance test...')
          
          try {
            const { WebSocketLoadTest } = require('./performance/websocket-load-test.js');
            
            const testConfig = {
              url: 'http://localhost:3000',
              numClients: config?.numClients || 10,
              rampUpTime: config?.rampUpTime || 5000,
              testDuration: config?.testDuration || 30000,
              protocol: config?.protocol || 'socketio',
              symbols: ['AAPL', 'GOOGL', 'MSFT', 'AMZN', 'TSLA']
            };
            
            const test = new WebSocketLoadTest(testConfig);
            await test.run();
            
            return { success: true, message: 'Performance test completed' };
          } catch (error) {
            console.error('Performance test failed:', error);
            return { success: false, error: error.message };
          }
        },

        // Clean up test data
        'db:cleanup': () => {
          console.log('🧹 Cleaning up test data...');
          return new Promise((resolve) => {
            setTimeout(() => {
              console.log('✅ Test data cleaned up');
              resolve(null);
            }, 500);
          });
        }
      });
    },
    
    env: {
      apiUrl: 'http://localhost:3000/api'
    }
  }
});
