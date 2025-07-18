// Replace the entire login command with this fixed version:
Cypress.Commands.add('login', (username, password) => {
  cy.visit('/')  // Visit root path instead
  // Then interact with login form on the main page
  cy.get('#login-email').should('be.visible').type(username)
  cy.get('#login-password').should('be.visible').type(password)
  cy.get('#loginForm').find('button[type="submit"]').click()
})
