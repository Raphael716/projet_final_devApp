const request = require("supertest");
const mockPrisma = require("../setup");
const fs = require("fs");

// Mock fs module
jest.mock("fs", () => ({
  existsSync: jest.fn().mockReturnValue(true),
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

let app;

beforeAll(() => {
  app = require("../../src/app");
});

beforeEach(() => {
  jest.clearAllMocks();
  fs.existsSync.mockReturnValue(true);
});

describe("Asset Routes Integration Tests", () => {
  describe("GET /api/assets/build/:id", () => {
    it("should return all assets for a build", async () => {
      const mockAssets = [
        {
          id: 1,
          filename: "file1.txt",
          original: "document.txt",
          mimetype: "text/plain",
          size: 100,
          path: "/uploads/file1.txt",
          buildId: 1,
          version: "1.0",
          createdAt: new Date(),
        },
        {
          id: 2,
          filename: "file2.pdf",
          original: "report.pdf",
          mimetype: "application/pdf",
          size: 5000,
          path: "/uploads/file2.pdf",
          buildId: 1,
          version: "1.0",
          createdAt: new Date(),
        },
      ];

      mockPrisma.asset.findMany.mockResolvedValue(mockAssets);

      const response = await request(app).get("/api/assets/build/1");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(2);
      expect(response.body[0]).toHaveProperty("displayType");
    });

    it("should return empty array for build with no assets", async () => {
      mockPrisma.asset.findMany.mockResolvedValue([]);

      const response = await request(app).get("/api/assets/build/1");

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body).toHaveLength(0);
    });

    it("should return 500 on database error", async () => {
      mockPrisma.asset.findMany.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/assets/build/1");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Erreur chargement fichiers");
    });
  });

  describe("GET /api/assets/:id", () => {
    it("should return an asset by id", async () => {
      const mockAsset = {
        id: 1,
        filename: "file1.txt",
        original: "document.txt",
        mimetype: "text/plain",
        size: 100,
        path: "/uploads/file1.txt",
        buildId: 1,
        build: {
          id: 1,
          nom: "Test Build",
          version: "1.0",
        },
      };

      mockPrisma.asset.findUnique.mockResolvedValue(mockAsset);

      const response = await request(app).get("/api/assets/1");

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("original", "document.txt");
      expect(response.body).toHaveProperty("displayType", "Fichier texte");
      expect(response.body).toHaveProperty("build");
    });

    it("should return 404 for non-existent asset", async () => {
      mockPrisma.asset.findUnique.mockResolvedValue(null);

      const response = await request(app).get("/api/assets/999");

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty("error", "Asset non trouvé");
    });

    it("should return 500 on database error", async () => {
      mockPrisma.asset.findUnique.mockRejectedValue(new Error("Database error"));

      const response = await request(app).get("/api/assets/1");

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty("error", "Erreur récupération asset");
    });
  });

  describe("POST /api/assets/upload/:buildId", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app)
        .post("/api/assets/upload/1")
        .field("version", "1.0");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Non autorisé : token manquant");
    });
  });

  describe("GET /api/assets/download/:id", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).get("/api/assets/download/1");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Non autorisé : token manquant");
    });
  });

  describe("DELETE /api/assets/:id", () => {
    it("should return 401 without authentication", async () => {
      const response = await request(app).delete("/api/assets/1");

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty("error", "Non autorisé : token manquant");
    });
  });
});
