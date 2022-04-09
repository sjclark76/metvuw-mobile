/// <reference types="cypress" />
describe('home page', () => {
  beforeEach(() => {
    // Cypress starts out with a blank slate for each test
    // so we must tell it to visit our website with the `cy.visit()` command.
    // Since we want to visit the same URL at the start of all our tests,
    // we include it in our beforeEach function so that it runs before each test
    cy.visit()
  })

  it('should have a forecast issued banner', () => {
    cy.contains('Forecast issued at')
  })

  it('should have at least one weather image', () => {
    cy.get('[data-testid="weather-image"]').should('have.length.greaterThan', 1)
  })
})
