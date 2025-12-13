const { Given, When, Then } = require('@badeball/cypress-cucumber-preprocessor');

Given("j'ouvre la page de connexion", () => {
  cy.visit('/login');
});

When("je me connecte avec l'email {string} et le mot de passe {string}", (email, password) => {
  cy.intercept('POST', '/api/auth/login', {
    statusCode: 200,
    body: {
      token: 'admin-token',
      user: { id: 7, email, username: 'Admin', isAdmin: 1 },
    },
  }).as('loginRequest');

  cy.get('input[type="email"]').clear().type(email);
  cy.get('input[type="password"]').clear().type(password);
  cy.contains('button', /se connecter/i).click();
  cy.wait('@loginRequest');
});

Then('je suis redirigé vers {string} et je vois {string} dans la navigation', (path, navText) => {
  cy.url().should('include', path);
  cy.contains('nav', navText).should('be.visible');
});

Given('je suis connecté en tant qu\'admin', () => {
  cy.visit('/', {
    onBeforeLoad(win) {
      const token = 'admin-token';
      const ADMIN = { id: 7, email: 'admin@example.com', username: 'Admin', isAdmin: true };
      win.localStorage.setItem('spl_token', token);
      win.localStorage.setItem('spl_user', JSON.stringify(ADMIN));
      win.localStorage.setItem('auth_token', token);
      win.localStorage.setItem('auth_user', JSON.stringify(ADMIN));
    },
  });
});

When('je crée un build avec le nom {string} et la version {string}', (name, version) => {
  cy.intercept('POST', '/api/builds', {
    statusCode: 201,
    body: { id: 99, nom: name },
  }).as('createBuild');

  cy.intercept('GET', '/api/builds/99', {
    statusCode: 200,
    body: { id: 99, nom: name, version, description: 'auto', statut: 'Production', proprietaire: 'PO', updatedAt: new Date().toISOString() },
  }).as('fetchBuildDetail');

  cy.visit('/builds/new');
  cy.get('input[name="nom"]').type(name);
  cy.get('textarea[name="description"]').type('Description automatique');
  cy.get('input[name="version"]').type(version);
  cy.get('select[name="statut"]').select('Production');
  cy.get('input[name="proprietaire"]').type('Automated Test');
  cy.contains('button', 'Créer').click();
  cy.wait('@createBuild');
  cy.url().should('include', '/builds/99');
  cy.wait('@fetchBuildDetail');
});

Then('je suis redirigé vers la page du build et je vois le nom {string}', (name) => {
  cy.contains('h2', name).should('be.visible');
});

Given('la liste de builds contient un élément appelé {string}', (label) => {
  const sampleBuilds = [
    { id: 1, nom: 'Logiciel Alpha', version: 'v1.0' },
    { id: 2, nom: 'Logiciel Beta', version: '0.5' },
  ];
  cy.intercept('GET', '/api/builds', { statusCode: 200, body: sampleBuilds }).as('fetchBuilds');
  cy.visit('/builds', {
    onBeforeLoad(win) {
      const token = 'admin-token';
      const ADMIN = { id: 7, email: 'admin@example.com', username: 'Admin', isAdmin: true };
      win.localStorage.setItem('spl_token', token);
      win.localStorage.setItem('spl_user', JSON.stringify(ADMIN));
      win.localStorage.setItem('auth_token', token);
      win.localStorage.setItem('auth_user', JSON.stringify(ADMIN));
    },
  });
  cy.wait('@fetchBuilds');
  cy.contains('td', label).should('be.visible');
});

When('j\'archive le build nommé {string}', (label) => {
  cy.intercept('DELETE', '/api/builds/2', { statusCode: 204 }).as('deleteBuild');
  cy.window().then((win) => {
    cy.stub(win, 'confirm').returns(true);
  });
  cy.contains('tr', label).within(() => {
    cy.contains('button', 'Archiver').click();
  });
  cy.wait('@deleteBuild');
});

Then('le build {string} n\'est plus visible dans la liste', (label) => {
  cy.contains(label).should('not.exist');
});
