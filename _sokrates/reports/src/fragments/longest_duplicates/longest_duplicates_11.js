cypress/e2e/admin.cy.js [6:11]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
    id: 1,
    username: "Admin",
    email: "admin@test.com",
    admin: 1,
    isAdmin: true,
  };
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



cypress/support/commands.js [4:10]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
  id: 1,
  username: "Admin",
  email: "admin@test.com",
  // Front app expects either `admin: 1` (used by AuthProvider) or `isAdmin: true` (AppUser type)
  admin: 1,
  isAdmin: true,
};
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



