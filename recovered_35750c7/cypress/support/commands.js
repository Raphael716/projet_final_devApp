/// <reference types="cypress" />

const ADMIN_DEFAULTS = {
  id: 1,
  username: "Admin",
  email: "admin@test.com",
  // Front app expects either `admin: 1` (used by AuthProvider) or `isAdmin: true` (AppUser type)
  admin: 1,
  isAdmin: true,
};

Cypress.Commands.add("visitAsAdmin", (path = "/", options = {}) => {
  const user = { ...ADMIN_DEFAULTS, ...(options.user ?? {}) };
  const token = options.token ?? "admin-token";
  const visitOptions = {
    ...options.visitOptions,
    onBeforeLoad(win) {
      if (options.visitOptions?.onBeforeLoad) {
        options.visitOptions.onBeforeLoad(win);
      }
      // Legacy keys still used in a few places
      win.localStorage.setItem("spl_token", token);
      win.localStorage.setItem("spl_user", JSON.stringify(user));

      // Keys actually read by the app's AuthProvider
      win.localStorage.setItem("auth_token", token);
      win.localStorage.setItem("auth_user", JSON.stringify(user));
    },
  };

  cy.visit(path, visitOptions);
});

Cypress.Commands.add("clearAuthState", () => {
  cy.window().then((win) => {
    win.localStorage.removeItem("spl_token");
    win.localStorage.removeItem("spl_user");
  });
});
