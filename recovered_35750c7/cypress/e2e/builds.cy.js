/// <reference types="cypress" />

describe("Build management", () => {
  const sampleBuilds = [
    {
      id: 1,
      nom: "Logiciel Alpha",
      description: "Description test",
      version: "v1.0",
      statut: "Production",
      proprietaire: "Equipe QA",
      updatedAt: new Date("2024-01-01T10:00:00Z").toISOString(),
    },
    {
      id: 2,
      nom: "Logiciel Beta",
      description: "En cours",
      version: "0.5",
      statut: "En développement",
      proprietaire: "Equipe Dev",
      updatedAt: new Date("2024-02-15T10:00:00Z").toISOString(),
    },
  ];

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  it("affiche la liste des builds et permet l'archivage", () => {
    cy.intercept("GET", "/api/builds", {
      statusCode: 200,
      body: sampleBuilds,
    }).as("fetchBuilds");

    cy.intercept("DELETE", "/api/builds/2", {
      statusCode: 204,
    }).as("deleteBuild");

    cy.visitAsAdmin("/builds");

    cy.wait("@fetchBuilds");
    cy.contains("td", "Logiciel Beta").should("be.visible");

    cy.window().then((win) => {
      cy.stub(win, "confirm").returns(true);
    });

    cy.contains("tr", "Logiciel Beta").within(() => {
      cy.contains("button", "Archiver").click();
    });

    cy.wait("@deleteBuild")
      .its("request.headers.authorization")
      .should((authHeader) => {
        expect(authHeader).to.match(/^Bearer\s.+/);
      });

    cy.contains("Logiciel Beta").should("not.exist");
  });

  it("permet de créer un build et d'accéder au détail immédiatement", () => {
    cy.intercept("POST", "/api/builds", {
      statusCode: 201,
      body: { id: 99, nom: "Nouveau Build" },
    }).as("createBuild");

    cy.intercept("GET", "/api/builds/99", {
      statusCode: 200,
      body: {
        id: 99,
        nom: "Nouveau Build",
        description: "Description courte",
        version: "2.0.0",
        statut: "Production",
        proprietaire: "Product Owner",
        updatedAt: new Date().toISOString(),
      },
    }).as("fetchBuildDetail");

    cy.intercept("GET", "/api/assets/build/99", {
      statusCode: 200,
      body: [
        {
          id: 501,
          original: "package.zip",
          filename: "package.zip",
          mimetype: "application/zip",
          size: 4096,
          path: "uploads/package.zip",
          buildId: 99,
          version: "2.0.0",
          createdAt: new Date().toISOString(),
        },
      ],
    }).as("fetchAssetsDetail");

    cy.visitAsAdmin("/builds/new");

    cy.get('input[name="nom"]').type("Nouvelle App");
    cy.get('textarea[name="description"]').type("Description courte");
    cy.get('input[name="version"]').type("2.0.0");
    cy.get('select[name="statut"]').select("Production");
    cy.get('input[name="proprietaire"]').type("Product Owner");

    cy.contains("button", "Créer").click();

    cy.wait("@createBuild").then((interception) => {
      expect(interception.request.headers.authorization).to.match(
        /^Bearer\s.+/
      );
      expect(interception.request.headers["content-type"]).to.include(
        "multipart/form-data"
      );
    });

    cy.url().should("include", "/builds/99");
    cy.wait("@fetchBuildDetail");
    cy.wait("@fetchAssetsDetail");
    cy.contains("h2", "Nouveau Build").should("be.visible");
    cy.contains("strong", "2.0.0").should("exist");
  });

  it("affiche un message d'erreur si la création échoue", () => {
    cy.intercept("POST", "/api/builds", {
      statusCode: 500,
    }).as("createBuildFail");

    cy.visitAsAdmin("/builds/new");

    cy.get('input[name="nom"]').type("Fail Build");
    cy.get('textarea[name="description"]').type("Doit échouer");
    cy.get('input[name="version"]').type("0.1.0");
    cy.get('select[name="statut"]').select("En développement");
    cy.get('input[name="proprietaire"]').type("Team");

    cy.contains("button", "Créer").click();

    cy.wait("@createBuildFail");
    cy.contains("Erreur création").should("be.visible");
  });
});
