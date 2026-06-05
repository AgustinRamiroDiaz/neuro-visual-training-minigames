/// <reference types="cypress" />

const appStoragePrefixes = ['neuro-visual-training', 'neuro-visual-training:'];

Cypress.Commands.add('clearTrainingStorage', () => {
  cy.window().then((window) => {
    Object.keys(window.localStorage)
      .filter((key) => appStoragePrefixes.some((prefix) => key.startsWith(prefix)))
      .forEach((key) => {
        window.localStorage.removeItem(key);
      });
  });
});

declare global {
  namespace Cypress {
    interface Chainable {
      clearTrainingStorage(): Chainable<void>;
    }
  }
}

export {};
