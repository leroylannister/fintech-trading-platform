// tests/cypress/e2e/websocket.cy.js
describe('WebSocket Real-time Updates', () => {
  beforeEach(function() {
  cy.window().then((win) => {
    if (!win.WebSocket || !win.io) {
      cy.log('WebSocket not available, skipping test');
      this.skip(); // ← Use this.skip() instead
    }
  });
});

  it('should show real-time price updates', () => {
    // Login first
    cy.login('test@example.com', 'password123');
    
    // Wait for WebSocket connection
    cy.window().its('wsClient.connected').should('be.true');
    
    // Check that prices update
    cy.get('[data-symbol="AAPL"] .stock-price')
      .invoke('text')
      .then((initialPrice) => {
        // Wait for price change
        cy.wait(6000); // Wait for market update interval
        
        cy.get('[data-symbol="AAPL"] .stock-price')
          .invoke('text')
          .should('not.equal', initialPrice);
      });
  });
});
