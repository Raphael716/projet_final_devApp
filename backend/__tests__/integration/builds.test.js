const request = require("supertest");
const mockPrisma = require("../setup");

let app;

beforeAll(() => {
  app = require("../../src/app");
});

beforeEach(() => {
  jest.clearAllMocks();
});

describe("Build Routes Integration Tests", () => {
  describe("GET /api/builds", () => {
    it("should return all builds", async () => {
      const mockBuilds = [
        {
          id: 1,
          nom: "Build 1",
          description: "First build",
          version: "1.0",
          statut: "active",
          proprietaire: "user1",
          updatedAt: new Date(),
          assets: [],
        },
        {
          id: 2,
          nom: "Build 2",
          description: "Second build",
          version: "2.0",
          statut: "inactive",
          proprietaire: "user2",
          updatedAt: new Date(),
          assets: [],
        },
      ];

      mockPrisma.builds.findMany.mockResolvedValue(mockBuilds);

      const response = await request(app).get("/api/builds");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
    });

    it("should return 500 on database error", async () => {
      mockPrisma.builds.findMany.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/builds");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error");
    });
  });

  describe("GET /api/builds/:id", () => {
    it("should return a build by id", async () => {
      const mockBuild = {
        id: 1,
        nom: "Test Build",
        description: "Test description",
        version: "1.0",
        statut: "active",
        proprietaire: "user1",
      };

      mockPrisma.builds.findUnique.mockResolvedValue(mockBuild);

      const response = await request(app).get("/api/builds/1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("nom", "Test Build");
    });

    it("should return 404 for non-existent build", async () => {
      mockPrisma.builds.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/api/builds/999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Build non trouvé");
    });
  });

  describe("POST /api/builds", () => {
    it("should create a new build", async () => {
      const newBuild = {
        id: 1,
        nom: "New Build",
        description: "New description",
        version: "1.0",
        statut: "active",
        proprietaire: "user1",
      };

      mockPrisma.builds.create.mockResolvedValue(newBuild);

      const response = await request(app)
        .post("/api/builds")
        .send({
          nom: "New Build",
          description: "New description",
          version: "1.0",
          statut: "active",
          proprietaire: "user1",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("nom", "New Build");
    });

    it("should return 500 on creation error", async () => {
      mockPrisma.builds.create.mockRejectedValue(new Error("Creation error"));

      const response = await request(app)
        .post("/api/builds")
        .send({
          nom: "New Build",
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Erreur création build");
    });
  });

  describe("PUT /api/builds/:id", () => {
    it("should update an existing build", async () => {
      const updatedBuild = {
        id: 1,
        nom: "Updated Build",
        description: "Updated description",
        version: "2.0",
        statut: "inactive",
        proprietaire: "user1",
      };

      mockPrisma.builds.update.mockResolvedValue(updatedBuild);

      const response = await request(app)
        .put("/api/builds/1")
        .send({
          nom: "Updated Build",
          description: "Updated description",
          version: "2.0",
          statut: "inactive",
          proprietaire: "user1",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("nom", "Updated Build");
      expect(response.body).toHaveProperty("version", "2.0");
    });

    it("should return 500 on update error", async () => {
      mockPrisma.builds.update.mockRejectedValue(new Error("Update error"));

      const response = await request(app)
        .put("/api/builds/999")
        .send({
          nom: "Updated Build",
        });

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Erreur mise à jour build");
    });
  });

  describe("DELETE /api/builds/:id", () => {
    it("should delete a build and its assets", async () => {
      mockPrisma.asset.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.builds.delete.mockResolvedValue({ id: 1 });

      const response = await request(app).delete("/api/builds/1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("message", "Build supprimé avec succès");
    });

    it("should return 500 on delete error", async () => {
      mockPrisma.asset.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.builds.delete.mockRejectedValue(new Error("Delete error"));

      const response = await request(app).delete("/api/builds/999");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Erreur suppression build");
    });
  });
});
