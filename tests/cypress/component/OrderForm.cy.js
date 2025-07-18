// tests/cypress/component/OrderForm.cy.js
import OrderForm from '../../frontend/components/OrderForm';

describe('OrderForm Component', () => {
  it('should show/hide price fields based on order type', () => {
    cy.mount(<OrderForm />);
    
    // Market order - no price fields
    cy.get('[data-cy=order-subtype]').select('MARKET');
    cy.get('[data-cy=limit-price]').should('not.exist');
    cy.get('[data-cy=stop-price]').should('not.exist');
    
    // Limit order - show limit price
    cy.get('[data-cy=order-subtype]').select('LIMIT');
    cy.get('[data-cy=limit-price]').should('be.visible');
    cy.get('[data-cy=stop-price]').should('not.exist');
    
    // Stop limit - show both prices
    cy.get('[data-cy=order-subtype]').select('STOP_LIMIT');
    cy.get('[data-cy=limit-price]').should('be.visible');
    cy.get('[data-cy=stop-price]').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.mount(<OrderForm />);
    
    // Try to submit empty form
    cy.get('[data-cy=place-order]').click();
    
    // Check validation messages
    cy.get('[data-cy=symbol-error]').should('contain', 'Symbol is required');
    cy.get('[data-cy=quantity-error]').should('contain', 'Quantity must be positive');
  });
});