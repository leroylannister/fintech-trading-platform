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
      // Implement node event listeners here
    },
    
    env: {
      apiUrl: 'http://localhost:3000/api'
    }
  }
});