// tests/cypress/e2e/advanced-trading.cy.js
describe('Advanced Trading Features', () => {
  beforeEach(() => {
    // ... your existing beforeEach code
  });

  it('should place different order types', () => {
    // ... your existing test
  });

  it('should update prices in real-time via WebSocket', () => {
    // ... your existing WebSocket test
  });

  // NEW TEST ADDED HERE
  it('should update market prices using custom command', () => {
    // Using the custom command
    cy.updateMarketPrice('AAPL', '155.50');
    
    // Verify the price was updated
    cy.get('.stock-card')
      .contains('AAPL')
      .parent()
      .find('.stock-price')
      .should('contain', '155.50');
  });

  it('should handle order book updates', () => {
    // ... your existing test
  });
});

// Existing custom command
Cypress.Commands.add('placeOrder', (order) => {
  // ... your existing command
});

// NEW CUSTOM COMMAND
Cypress.Commands.add('updateMarketPrice', (symbol, price) => {
  cy.task('market:updatePrice', { symbol, price });
  
  // Wait for price to update in UI
  cy.get('.stock-card')
    .contains(symbol)
    .parent()
    .find('.stock-price')
    .should('contain', price);
});
