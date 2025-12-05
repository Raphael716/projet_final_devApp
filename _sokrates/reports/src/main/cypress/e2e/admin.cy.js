/// <reference types="cypress" />

// Completely rewritten to avoid network alias timing issues by stubbing window.fetch
describe("Admin user management", () => {
  const ADMIN = {
    id: 1,
    username: "Admin",
    email: "admin@test.com",
    admin: 1,
    isAdmin: true,
  };

  const users = [
    ADMIN,
    { id: 2, username: "Alice", email: "alice@test.com", admin: 0 },
  ];

  function visitPathWithStubbedFetch(path, handlerFactory) {
    cy.visit(path, {
      onBeforeLoad(win) {
        // Auth state for both legacy App.tsx and AuthProvider.tsx
        const token = "admin-token";
        win.localStorage.setItem("spl_token", token);
        win.localStorage.setItem("spl_user", JSON.stringify(ADMIN));
        win.localStorage.setItem("auth_token", token);
        win.localStorage.setItem("auth_user", JSON.stringify(ADMIN));

        // Stub confirm default to true
        win.confirm = () => true;

        // Stub fetch behavior for this test
        const originalFetch = win.fetch.bind(win);
        const handler = handlerFactory({ originalFetch, win });
        win.fetch = (input, init = {}) => {
          const url = typeof input === "string" ? input : input.url;
          const method = (init.method || "GET").toUpperCase();

          return handler({ url, method, input, init });
        };
      },
    });
  }

  it("renders users list for admin", () => {
    visitPathWithStubbedFetch("/", () => ({ url, method }) => {
      if (url.includes("/api/users") && method === "GET") {
        return Promise.resolve({ ok: true, json: async () => users });
      }
      // Fallback
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    // Navigate after app hydrates auth
    cy.contains("a", "Utilisateurs", { timeout: 10000 })
      .should("be.visible")
      .click();
    cy.location("pathname").should("eq", "/admin/users");
    cy.contains("h2", "Gestion des utilisateurs").should("be.visible");
    cy.contains("td", "alice@test.com", { timeout: 10000 }).should(
      "be.visible"
    );
    cy.contains("tr", "Alice").within(() => {
      cy.contains("button", "Supprimer").should("be.visible");
      cy.contains("a", "Modifier").should("be.visible");
    });
  });

  it("shows an error message when the API fails", () => {
    visitPathWithStubbedFetch("/", () => ({ url, method }) => {
      if (url.includes("/api/users") && method === "GET") {
        return Promise.resolve({
          ok: false,
          status: 500,
          json: async () => ({}),
        });
      }
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    cy.contains("a", "Utilisateurs", { timeout: 10000 })
      .should("be.visible")
      .click();
    cy.location("pathname").should("eq", "/admin/users");
    cy.contains("Impossible de charger les utilisateurs", {
      timeout: 10000,
    }).should("be.visible");
  });

  it("redirects non-admin to home", () => {
    cy.visit("/admin/users", {
      onBeforeLoad(win) {
        const NON_ADMIN = {
          id: 10,
          username: "User",
          email: "user@test.com",
          admin: 0,
          isAdmin: false,
        };
        const token = "user-token";
        win.localStorage.setItem("spl_token", token);
        win.localStorage.setItem("spl_user", JSON.stringify(NON_ADMIN));
        win.localStorage.setItem("auth_token", token);
        win.localStorage.setItem("auth_user", JSON.stringify(NON_ADMIN));
      },
    });
    cy.location("pathname", { timeout: 10000 }).should("eq", "/");
  });
});
