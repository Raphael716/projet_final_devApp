import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. HOISTED
const { prismaMock, fsMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      builds: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
      asset: {
        create: vi.fn(),
        deleteMany: vi.fn(),
      },
    },
    fsMock: {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      unlinkSync: vi.fn(),
      accessSync: vi.fn(),
      constants: { W_OK: 2 },
    },
  };
});

// 2. MOCKING
vi.mock("@prisma/client", () => {
  return {
    PrismaClient: class {
      constructor() {
        return prismaMock;
      }
    },
  };
});

vi.mock("fs", () => ({
  default: fsMock,
  ...fsMock,
}));

// 3. IMPORT
import * as buildController from "../controllers/buildController.js";

describe("Build Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("getBuilds: doit retourner les builds", async () => {
    const req = {};
    const res = { json: vi.fn() };
    const mockBuilds = [{ id: 1 }];

    prismaMock.builds.findMany.mockResolvedValue(mockBuilds);

    await buildController.getBuilds(req, res);
    expect(res.json).toHaveBeenCalledWith(mockBuilds);
  });

  it("createBuild: doit créer un build", async () => {
    const req = {
      body: { nom: "Test" },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.builds.create.mockResolvedValue({ id: 1, nom: "Test" });

    await buildController.createBuild(req, res);
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("addVersion: doit ajouter une version", async () => {
    // Le handler est le 2ème élément du tableau exporté
    const handler = buildController.addVersion[1];
    const req = {
      params: { id: "1" },
      body: { version: "2.0" },
      file: {
        filename: "t.zip",
        originalname: "t.zip",
        mimetype: "zip",
        size: 10,
        path: "p",
      },
    };
    const res = { json: vi.fn() };

    prismaMock.builds.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.builds.update.mockResolvedValue({ id: 1 });
    prismaMock.asset.create.mockResolvedValue({ id: 50 });

    await handler(req, res);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });
});
