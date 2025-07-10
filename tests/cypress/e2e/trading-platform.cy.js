// tests/cypress/e2e/trading-platform.cy.js

describe('Trading Platform E2E Tests', () => {
  const baseUrl = 'http://localhost:8080';
  const apiUrl = 'http://localhost:3000/api';
  
  // Generate unique email for each test run
  const testEmail = `test${Date.now()}@example.com`;
  const testPassword = 'password123';
  
  beforeEach(() => {
    cy.visit(baseUrl);
  });
  
  describe('Authentication', () => {
    it('should register a new user', () => {
      // Click register link
      cy.contains('Register').click();
      
      // Fill registration form
      cy.get('#register-name').type('Test User');
      cy.get('#register-email').type(testEmail);
      cy.get('#register-password').type(testPassword);
      
      // Submit form
      cy.get('#registerForm').submit();
      
      // Should redirect to dashboard
      cy.get('#dashboard-section').should('be.visible');
      cy.get('#user-email').should('contain', testEmail);
      cy.get('#user-balance').should('contain', '$10,000.00');
    });
    
    it('should login existing user', () => {
      // First register a user
      cy.request('POST', `${apiUrl}/auth/register`, {
        email: testEmail,
        password: testPassword,
        fullName: 'Test User'
      });
      
      // Fill login form
      cy.get('#login-email').type(testEmail);
      cy.get('#login-password').type(testPassword);
      
      // Submit form
      cy.get('#loginForm').submit();
      
      // Should show dashboard
      cy.get('#dashboard-section').should('be.visible');
      cy.get('#user-email').should('contain', testEmail);
    });
    
    it('should logout user', () => {
      // Login first
      cy.get('#login-email').type(testEmail);
      cy.get('#login-password').type(testPassword);
      cy.get('#loginForm').submit();
      
      // Click logout
      cy.get('#logout-btn').click();
      
      // Should show auth section
      cy.get('#auth-section').should('be.visible');
      cy.get('#dashboard-section').should('not.be.visible');
    });
  });
  
  describe('Trading Features', () => {
    beforeEach(() => {
      // Login before each trading test
      cy.get('#login-email').type(testEmail);
      cy.get('#login-password').type(testPassword);
      cy.get('#loginForm').submit();
      cy.get('#dashboard-section').should('be.visible');
    });
    
    it('should display market prices', () => {
      // Check market prices are loaded
      cy.get('.stock-card').should('have.length.greaterThan', 0);
      
      // Check stock card structure
      cy.get('.stock-card').first().within(() => {
        cy.get('.stock-symbol').should('exist');
        cy.get('.stock-price').should('exist');
        cy.get('.price-change').should('exist');
      });
    });
    
    it('should place a buy order', () => {
      // Fill order form
      cy.get('#order-symbol').select('AAPL');
      cy.get('#order-type').select('BUY');
      cy.get('#order-quantity').type('5');
      cy.get('#order-price').type('150');
      
      // Submit order
      cy.get('#order-form').submit();
      
      // Check success message
      cy.get('#order-message')
        .should('be.visible')
        .and('have.class', 'success')
        .and('contain', 'Order executed successfully');
      
      // Check portfolio updated
      cy.get('#holdings-body tr').should('contain', 'AAPL');
    });
    
    it('should display portfolio correctly', () => {
      // Check portfolio summary
      cy.get('#cash-balance').should('exist');
      cy.get('#market-value').should('exist');
      cy.get('#total-value').should('exist');
      
      // Check holdings table
      cy.get('#holdings-table').should('be.visible');
      cy.get('#holdings-body tr').should('have.length.greaterThan', 0);
    });
    
    it('should display order history', () => {
      // Check order history table
      cy.get('#history-table').should('be.visible');
      cy.get('#history-body tr').should('have.length.greaterThan', 0);
      
      // Check order details
      cy.get('#history-body tr').first().within(() => {
        cy.get('td').should('have.length', 6);
      });
    });
  });
  
  describe('Error Handling', () => {
    it('should show error for invalid login', () => {
      cy.get('#login-email').type('invalid@example.com');
      cy.get('#login-password').type('wrongpassword');
      cy.get('#loginForm').submit();
      
      // Should show alert (you can improve this with proper error messages)
      cy.on('window:alert', (text) => {
        expect(text).to.contain('Invalid credentials');
      });
    });
    
    it('should validate order form inputs', () => {
      // Login first
      cy.get('#login-email').type(testEmail);
      cy.get('#login-password').type(testPassword);
      cy.get('#loginForm').submit();
      
      // Try to submit empty form
      cy.get('#order-form').submit();
      
      // Check HTML5 validation
      cy.get('#order-symbol:invalid').should('exist');
    });
  });
});