import { defineConfig } from 'cypress';

export default defineConfig({
  allowCypressEnv: false,
  video: false,
  viewportHeight: 900,
  viewportWidth: 1280,

  e2e: {
    baseUrl: 'http://127.0.0.1:5173',
    specPattern: 'cypress/e2e/**/*.cy.ts',
    supportFile: 'cypress/support/e2e.ts',
  },
});
