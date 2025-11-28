const mockPrisma = require("../setup");

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

describe("BuildController", () => {
  let buildController;
  let mockReq;
  let mockRes;

  beforeAll(() => {
    buildController = require("../../src/controllers/buildController");
  });

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
    };
  });

  describe("getBuilds", () => {
    it("should return all builds successfully", async () => {
      const mockBuilds = [
        { id: 1, nom: "Build 1", description: "Test build", version: "1.0", statut: "active", proprietaire: "user1", updatedAt: new Date() },
        { id: 2, nom: "Build 2", description: "Another build", version: "2.0", statut: "inactive", proprietaire: "user2", updatedAt: new Date() },
      ];
      mockPrisma.builds.findMany.mockResolvedValue(mockBuilds);

      await buildController.getBuilds(mockReq, mockRes);

      expect(mockPrisma.builds.findMany).toHaveBeenCalledWith({
        orderBy: { updatedAt: "desc" },
      });
      expect(mockRes.json).toHaveBeenCalledWith(mockBuilds);
    });

    it("should return 500 on database failure", async () => {
      mockPrisma.builds.findMany.mockRejectedValue(new Error("Database error"));

      await buildController.getBuilds(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Erreur récupération builds" });
    });
  });

  describe("getBuildById", () => {
    it("should return a build by id", async () => {
      const mockBuild = { id: 1, nom: "Build 1", description: "Test build", version: "1.0", statut: "active", proprietaire: "user1" };
      mockReq.params.id = "1";
      mockPrisma.builds.findUnique.mockResolvedValue(mockBuild);

      await buildController.getBuildById(mockReq, mockRes);

      expect(mockPrisma.builds.findUnique).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRes.json).toHaveBeenCalledWith(mockBuild);
    });

    it("should return 404 if build not found", async () => {
      mockReq.params.id = "999";
      mockPrisma.builds.findUnique.mockResolvedValue(null);

      await buildController.getBuildById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Build non trouvé" });
    });

    it("should return 500 on database error", async () => {
      mockReq.params.id = "1";
      mockPrisma.builds.findUnique.mockRejectedValue(new Error("DB Error"));

      await buildController.getBuildById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Erreur récupération build" });
    });
  });

  describe("createBuild", () => {
    it("should create a new build successfully", async () => {
      const newBuildData = {
        nom: "New Build",
        description: "New build description",
        version: "1.0",
        statut: "active",
        proprietaire: "owner1",
      };
      const createdBuild = { id: 1, ...newBuildData };

      mockReq.body = newBuildData;
      mockPrisma.builds.create.mockResolvedValue(createdBuild);

      await buildController.createBuild(mockReq, mockRes);

      expect(mockPrisma.builds.create).toHaveBeenCalledWith({
        data: newBuildData,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(createdBuild);
    });

    it("should return 500 on creation failure", async () => {
      mockReq.body = { nom: "Test Build" };
      mockPrisma.builds.create.mockRejectedValue(new Error("Create failed"));

      await buildController.createBuild(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Erreur création build" });
    });
  });

  describe("updateBuild", () => {
    it("should update a build successfully", async () => {
      const updatedBuild = {
        id: 1,
        nom: "Updated Build",
        description: "Updated description",
        version: "2.0",
        statut: "inactive",
        proprietaire: "owner1",
      };
      mockReq.params.id = "1";
      mockReq.body = {
        nom: "Updated Build",
        description: "Updated description",
        version: "2.0",
        statut: "inactive",
        proprietaire: "owner1",
      };
      mockPrisma.builds.update.mockResolvedValue(updatedBuild);

      await buildController.updateBuild(mockReq, mockRes);

      expect(mockPrisma.builds.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: mockReq.body,
      });
      expect(mockRes.json).toHaveBeenCalledWith(updatedBuild);
    });

    it("should return 500 on update failure", async () => {
      mockReq.params.id = "1";
      mockReq.body = { nom: "test" };
      mockPrisma.builds.update.mockRejectedValue(new Error("Update failed"));

      await buildController.updateBuild(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Erreur mise à jour build" });
    });
  });

  describe("deleteBuild", () => {
    it("should delete a build and its assets successfully", async () => {
      mockReq.params.id = "1";
      mockPrisma.asset.deleteMany.mockResolvedValue({ count: 2 });
      mockPrisma.builds.delete.mockResolvedValue({ id: 1 });

      await buildController.deleteBuild(mockReq, mockRes);

      expect(mockPrisma.asset.deleteMany).toHaveBeenCalledWith({ where: { buildId: 1 } });
      expect(mockPrisma.builds.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRes.json).toHaveBeenCalledWith({ message: "Build supprimé avec succès" });
    });

    it("should return 500 on delete failure", async () => {
      mockReq.params.id = "1";
      mockPrisma.asset.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.builds.delete.mockRejectedValue(new Error("Delete failed"));

      await buildController.deleteBuild(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Erreur suppression build" });
    });
  });
});
