/// <reference types="cypress" />

describe("Authentication", () => {
  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("allows an admin to sign in and see admin navigation", () => {
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 200,
      body: {
        token: "admin-token",
        user: {
          id: 7,
          email: "admin@example.com",
          username: "Admin",
          isAdmin: 1,
        },
      },
    }).as("loginRequest");

    cy.visit("/login");

    cy.get('input[type="email"]').type("admin@example.com");
    cy.get('input[type="password"]').type("super-secret");
    cy.contains("button", /se connecter/i).click();

    cy.wait("@loginRequest").its("request.body").should("deep.equal", {
      email: "admin@example.com",
      password: "super-secret",
    });

    cy.url().should("eq", `${Cypress.config().baseUrl}/`);
    cy.contains("nav", "Utilisateurs").should("be.visible");
    cy.get(".admin-badge").should("contain", "Admin");

    cy.window().then((win) => {
      expect(win.localStorage.getItem("spl_token")).to.eq("admin-token");
      const storedUser = JSON.parse(
        win.localStorage.getItem("spl_user") ?? "{}"
      );
      expect(storedUser.email).to.eq("admin@example.com");
      expect(storedUser.isAdmin).to.eq(true);
    });
  });

  it("affiche un message d'erreur quand les identifiants sont invalides", () => {
    cy.intercept("POST", "/api/auth/login", {
      statusCode: 401,
      body: { error: "Identifiants invalides" },
    }).as("loginRequest");

    cy.visit("/login");

    cy.get('input[type="email"]').type("bad@example.com");
    cy.get('input[type="password"]').type("wrong-password");
    cy.contains("button", /se connecter/i).click();

    cy.wait("@loginRequest");
    cy.get(".auth-error").should("contain", "Identifiants invalides");
    cy.url().should("include", "/login");
  });
});
