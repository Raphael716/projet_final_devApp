const mockPrisma = require("../setup");
const path = require("path");
const fs = require("fs");

// Mock fs module
jest.mock("fs", () => ({
  existsSync: jest.fn(),
  mkdirSync: jest.fn(),
  unlinkSync: jest.fn(),
  accessSync: jest.fn(),
  createReadStream: jest.fn(),
  promises: {
    access: jest.fn(),
  },
  constants: {
    W_OK: 2,
    R_OK: 4,
  },
}));

// Clear all mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
  fs.existsSync.mockReturnValue(true);
});

describe("AssetController", () => {
  let assetController;
  let mockReq;
  let mockRes;

  beforeAll(() => {
    assetController = require("../../src/controllers/assetController");
  });

  beforeEach(() => {
    mockReq = {
      params: {},
      body: {},
      file: null,
    };
    mockRes = {
      json: jest.fn().mockReturnThis(),
      status: jest.fn().mockReturnThis(),
      setHeader: jest.fn().mockReturnThis(),
    };
  });

  describe("getAssetsByBuild", () => {
    it("should return all assets for a build", async () => {
      const mockAssets = [
        { id: 1, filename: "file1.txt", original: "test.txt", mimetype: "text/plain", size: 100, path: "/uploads/file1.txt", buildId: 1, version: "1.0", createdAt: new Date() },
        { id: 2, filename: "file2.pdf", original: "doc.pdf", mimetype: "application/pdf", size: 2000, path: "/uploads/file2.pdf", buildId: 1, version: "1.0", createdAt: new Date() },
      ];
      mockReq.params.id = "1";
      mockPrisma.asset.findMany.mockResolvedValue(mockAssets);

      await assetController.getAssetsByBuild(mockReq, mockRes);

      expect(mockPrisma.asset.findMany).toHaveBeenCalledWith({
        where: { buildId: 1 },
        select: {
          id: true,
          filename: true,
          original: true,
          mimetype: true,
          size: true,
          path: true,
          buildId: true,
          version: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      });
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should return 500 on database error", async () => {
      mockReq.params.id = "1";
      mockPrisma.asset.findMany.mockRejectedValue(new Error("DB Error"));

      await assetController.getAssetsByBuild(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Erreur chargement fichiers" });
    });
  });

  describe("getAssetById", () => {
    it("should return an asset by id", async () => {
      const mockAsset = {
        id: 1,
        filename: "file1.txt",
        original: "test.txt",
        mimetype: "text/plain",
        size: 100,
        path: "/uploads/file1.txt",
        buildId: 1,
        build: { id: 1, nom: "Test Build", version: "1.0" },
      };
      mockReq.params.id = "1";
      mockPrisma.asset.findUnique.mockResolvedValue(mockAsset);

      await assetController.getAssetById(mockReq, mockRes);

      expect(mockPrisma.asset.findUnique).toHaveBeenCalledWith({
        where: { id: 1 },
        include: {
          build: {
            select: {
              id: true,
              nom: true,
              version: true,
            },
          },
        },
      });
      expect(mockRes.json).toHaveBeenCalled();
    });

    it("should return 404 if asset not found", async () => {
      mockReq.params.id = "999";
      mockPrisma.asset.findUnique.mockResolvedValue(null);

      await assetController.getAssetById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Asset non trouvé" });
    });

    it("should return 500 on database error", async () => {
      mockReq.params.id = "1";
      mockPrisma.asset.findUnique.mockRejectedValue(new Error("DB Error"));

      await assetController.getAssetById(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Erreur récupération asset" });
    });
  });

  describe("uploadFiles", () => {
    it("should return 400 for invalid build id", async () => {
      mockReq.params.buildId = "invalid";

      await assetController.uploadFiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "ID du build invalide" });
    });

    it("should return 404 if build does not exist", async () => {
      mockReq.params.buildId = "999";
      mockPrisma.builds.findUnique.mockResolvedValue(null);

      await assetController.uploadFiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Build non trouvé" });
    });

    it("should return 400 if version is missing", async () => {
      mockReq.params.buildId = "1";
      mockReq.body = {};
      mockReq.file = { filename: "test.txt", originalname: "test.txt", mimetype: "text/plain", size: 100, path: "/uploads/test.txt" };
      mockPrisma.builds.findUnique.mockResolvedValue({ id: 1, nom: "Test Build" });

      await assetController.uploadFiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Le numéro de version est requis" });
    });

    it("should return 400 if no file is provided", async () => {
      mockReq.params.buildId = "1";
      mockReq.body = { version: "1.0" };
      mockReq.file = null;
      mockPrisma.builds.findUnique.mockResolvedValue({ id: 1, nom: "Test Build" });

      await assetController.uploadFiles(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Aucun fichier envoyé" });
    });

    it("should upload file successfully", async () => {
      const mockFile = {
        filename: "12345-test.txt",
        originalname: "test.txt",
        mimetype: "text/plain",
        size: 100,
        path: "/uploads/12345-test.txt",
      };
      const mockAsset = {
        id: 1,
        filename: mockFile.filename,
        original: mockFile.originalname,
        mimetype: mockFile.mimetype,
        size: mockFile.size,
        path: mockFile.path,
        buildId: 1,
        version: "1.0",
      };

      mockReq.params.buildId = "1";
      mockReq.body = { version: "1.0", description: "Test file" };
      mockReq.file = mockFile;

      mockPrisma.builds.findUnique.mockResolvedValue({ id: 1, nom: "Test Build" });
      mockPrisma.asset.create.mockResolvedValue(mockAsset);
      mockPrisma.builds.update.mockResolvedValue({ id: 1, version: "1.0" });

      await assetController.uploadFiles(mockReq, mockRes);

      expect(mockPrisma.asset.create).toHaveBeenCalled();
      expect(mockPrisma.builds.update).toHaveBeenCalledWith({
        where: { id: 1 },
        data: { version: "1.0" },
      });
      expect(mockRes.json).toHaveBeenCalledWith({
        success: true,
        asset: mockAsset,
        message: "Version ajoutée avec succès",
      });
    });
  });

  describe("deleteAsset", () => {
    it("should return 404 if asset not found", async () => {
      mockReq.params.id = "999";
      mockPrisma.asset.findUnique.mockResolvedValue(null);

      await assetController.deleteAsset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Fichier non trouvé" });
    });

    it("should delete asset successfully", async () => {
      const mockAsset = {
        id: 1,
        filename: "test.txt",
        path: "/uploads/test.txt",
      };
      mockReq.params.id = "1";
      mockPrisma.asset.findUnique.mockResolvedValue(mockAsset);
      mockPrisma.asset.delete.mockResolvedValue(mockAsset);
      fs.existsSync.mockReturnValue(false);

      await assetController.deleteAsset(mockReq, mockRes);

      expect(mockPrisma.asset.delete).toHaveBeenCalledWith({ where: { id: 1 } });
      expect(mockRes.json).toHaveBeenCalledWith({ success: true });
    });

    it("should return 500 on delete error", async () => {
      mockReq.params.id = "1";
      mockPrisma.asset.findUnique.mockResolvedValue({ id: 1, path: "/uploads/test.txt" });
      mockPrisma.asset.delete.mockRejectedValue(new Error("Delete error"));
      fs.existsSync.mockReturnValue(false);

      await assetController.deleteAsset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(500);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Erreur suppression asset" });
    });
  });

  describe("downloadAsset", () => {
    it("should return 404 if asset not found in database", async () => {
      mockReq.params.id = "999";
      mockPrisma.asset.findUnique.mockResolvedValue(null);

      await assetController.downloadAsset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Fichier non trouvé" });
    });

    it("should return 404 if file does not exist on server", async () => {
      const mockAsset = {
        id: 1,
        filename: "test.txt",
        original: "test.txt",
        path: "/nonexistent/path.txt",
        mimetype: "text/plain",
      };
      mockReq.params.id = "1";
      mockPrisma.asset.findUnique.mockResolvedValue(mockAsset);
      fs.existsSync.mockReturnValue(false);

      await assetController.downloadAsset(mockReq, mockRes);

      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith({ error: "Fichier manquant sur le serveur" });
    });
  });
});
