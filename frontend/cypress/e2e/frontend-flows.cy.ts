/// <reference types="cypress" />

const historyKey = 'neuro-visual-training-play-history';
const settingsKey = 'neuro-visual-training-game-settings';
const appStoragePrefixes = ['neuro-visual-training', 'neuro-visual-training:'];

interface StoredHistoryRecord {
  gameId: string;
  gameName: string;
  metadata: Record<string, unknown>;
}

type StoredSettings = Record<string, unknown>;

function parseJson<TValue>(value: string | null, fallback: TValue): TValue {
  if (!value) {
    return fallback;
  }

  return JSON.parse(value) as TValue;
}

function stubCloudHealth(isOnline = false) {
  cy.intercept('GET', '/api/health', {
    statusCode: isOnline ? 200 : 503,
    body: isOnline ? { status: 'ok' } : { error: 'offline' },
  }).as('cloudHealth');
}

function visitApp(path = '/') {
  stubCloudHealth();
  cy.visit(path, {
    onBeforeLoad(window) {
      Object.keys(window.localStorage)
        .filter((key) => appStoragePrefixes.some((prefix) => key.startsWith(prefix)))
        .forEach((key) => {
          window.localStorage.removeItem(key);
        });
    },
  });
}

function assertCatalogCards() {
  cy.contains('h1', 'Choose a focused visual skill drill.').should('be.visible');
  cy.contains('button', 'Dual Lane Drive').should('be.visible');
  cy.contains('button', 'Rhythm Lanes').should('be.visible');
}

function expectPlayableCanvas(title: string) {
  cy.contains('h1', title).should('be.visible');
  cy.get('.phaser-game canvas', { timeout: 10000 })
    .should('be.visible')
    .and(($canvas) => {
      expect($canvas[0].clientWidth).to.be.greaterThan(300);
      expect($canvas[0].clientHeight).to.be.greaterThan(250);
    });
}

describe('frontend user flows', () => {
  beforeEach(() => {
    visitApp();
  });

  it('lets a user browse, filter, search, and recover from empty catalog results', () => {
    assertCatalogCards();

    cy.get('input[placeholder="Try reaction, tracking, memory..."]').type('rhythm');
    cy.contains('button', 'Rhythm Lanes').should('be.visible');
    cy.contains('button', 'Dual Lane Drive').should('not.exist');

    cy.get('input[placeholder="Try reaction, tracking, memory..."]').clear().type('not a drill');
    cy.contains('No minigames match that search.').should('be.visible');

    cy.get('input[placeholder="Try reaction, tracking, memory..."]').clear();
    cy.contains('button', 'Reaction').click();
    cy.contains('button', 'Dual Lane Drive').should('be.visible');
    cy.contains('button', 'Rhythm Lanes').should('not.exist');

    cy.contains('button', 'All').click();
    assertCatalogCards();
  });

  it('runs the Dual Lane Drive setup into a Phaser session and tears it down on return', () => {
    cy.contains('button', 'Dual Lane Drive').click();
    cy.contains('h1', 'Dual Lane Drive').should('be.visible');
    cy.contains('button', 'F + J').click();

    cy.contains('label', 'Save current').find('input').type('home row');
    cy.contains('button', 'Save preset').click();
    cy.contains('button', 'home row').should('be.visible');

    cy.contains('button', 'Start').click();
    cy.location('hash').should('eq', '#/games/dual-lane-drive/play');
    expectPlayableCanvas('Dual Lane Drive');

    cy.get('body').type('fjfj');
    cy.contains('a,button', 'Minigames').click();
    assertCatalogCards();
    cy.get('.phaser-game canvas').should('not.exist');

    cy.window().then((window) => {
      const savedSettings = parseJson<StoredSettings>(
        window.localStorage.getItem(settingsKey),
        {},
      );
      expect(savedSettings['dual-lane-drive']).to.deep.equal({
        sceneKey: 'DualLaneDriveScene',
        settings: {
          leftKey: 'F',
          rightKey: 'J',
        },
      });
    });
  });

  it('runs Rhythm Lanes from setup through game over and records history', () => {
    cy.contains('button', 'Rhythm Lanes').click();
    cy.contains('h1', 'Rhythm Lanes').should('be.visible');
    cy.contains('button', 'AWD').click();
    cy.get('button[aria-label="Add lane after D"]').click();
    cy.get('button[aria-label="Remove W lane"]').click();

    cy.contains('label', 'Save current').find('input').type('three lane drill');
    cy.contains('button', 'Save preset').click();
    cy.contains('button', 'three lane drill').should('be.visible');

    cy.contains('button', 'Start').click();
    cy.location('hash').should('eq', '#/games/rhythm-lanes/play');
    expectPlayableCanvas('Rhythm Lanes');

    cy.get('body').type('aaaaaaaa');
    cy.window()
      .its('localStorage')
      .invoke('getItem', historyKey)
      .should((rawHistory) => {
        const records = parseJson<StoredHistoryRecord[]>(String(rawHistory), []);
        expect(records).to.have.length(1);
        expect(records[0]).to.include({
          gameId: 'rhythm-lanes',
          gameName: 'Rhythm Lanes',
        });
        expect(records[0].metadata).to.include({
          misses: 8,
          finalStreak: 0,
        });
      });

    cy.contains('a,button', 'History').click();
    cy.contains('h1', 'Review completed playthroughs.').should('be.visible');
    cy.contains('strong', 'Rhythm Lanes').should('be.visible');
    cy.contains('dt', 'Misses').next('dd').should('have.text', '8');

    cy.contains('a,button', 'Minigames').click();
    cy.contains('button', 'Rhythm Lanes')
      .contains('small', 'Last played')
      .should('be.visible');
  });

  it('covers account registration, logout, and login with cloud API calls', () => {
    stubCloudHealth(true);
    const user = {
      id: 'user-1',
      username: 'training-user',
      display_name: 'Training User',
      created_at: '2026-06-04T12:00:00.000Z',
    };

    cy.intercept('POST', '/api/users', {
      statusCode: 200,
      body: user,
    }).as('registerUser');
    cy.intercept('PUT', '/api/users/user-1/preferences', {
      statusCode: 200,
      body: {},
    }).as('savePreferences');
    cy.intercept('PUT', '/api/users/user-1/history', {
      statusCode: 200,
      body: [],
    }).as('replaceHistory');
    cy.intercept('POST', '/api/login', {
      statusCode: 200,
      body: user,
    }).as('loginUser');
    cy.intercept('GET', '/api/users/user-1/sync', {
      statusCode: 200,
      body: {
        user,
        preferences: { gameSettings: {} },
        history: [],
      },
    }).as('loadSync');

    cy.visit('/#/register');
    cy.contains('h1', 'Register').should('be.visible');
    cy.contains('label', 'Username').find('input').type(user.username);
    cy.contains('label', 'Display name').find('input').type('Training User');
    cy.contains('button', 'Create account').click();

    cy.wait('@registerUser');
    cy.wait('@savePreferences');
    cy.wait('@replaceHistory');
    cy.contains('.account-name', user.username).should('be.visible');

    cy.contains('button', 'Log out').click();
    cy.contains('.account-name', user.username).should('not.exist');

    cy.visit('/#/login');
    cy.contains('h1', 'Log in').should('be.visible');
    cy.contains('label', 'Username').find('input').type(user.username);
    cy.contains('button', 'Log in').click();

    cy.wait('@loginUser');
    cy.wait('@loadSync');
    cy.contains('.account-name', user.username).should('be.visible');
    cy.contains('h1', 'Choose a focused visual skill drill.').should('be.visible');
  });
});
