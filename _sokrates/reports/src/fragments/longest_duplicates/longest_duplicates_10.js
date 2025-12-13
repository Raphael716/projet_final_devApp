cypress/e2e/admin.cy.js [50:56]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    // Navigate after app hydrates auth
    cy.contains("a", "Utilisateurs", { timeout: 10000 })
      .should("be.visible")
      .click();
    cy.location("pathname").should("eq", "/admin/users");
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



cypress/e2e/admin.cy.js [76:81]:
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -
      return Promise.resolve({ ok: true, json: async () => ({}) });
    });
    cy.contains("a", "Utilisateurs", { timeout: 10000 })
      .should("be.visible")
      .click();
    cy.location("pathname").should("eq", "/admin/users");
- - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - - -



