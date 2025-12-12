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

  it("createBuild: retourne 400 si nom manquant", async () => {
    const req = { body: { description: "d" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await buildController.createBuild(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it("createBuild: retourne 400 si fichier fourni sans version", async () => {
    const req = { body: { nom: "X" }, file: { filename: 'a' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await buildController.createBuild(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it("getBuildById: retourne 404 si non trouvé", async () => {
    const req = { params: { id: "999" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.builds.findUnique.mockResolvedValue(null);

    await buildController.getBuildById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("getBuildById: retourne le build si trouvé", async () => {
    const req = { params: { id: "2" } };
    const res = { json: vi.fn() };

    prismaMock.builds.findUnique.mockResolvedValue({ id: 2, nom: 'B' });

    await buildController.getBuildById(req, res);

    expect(res.json).toHaveBeenCalledWith({ id: 2, nom: 'B' });
  });

  it("updateBuild: met à jour un build", async () => {
    const req = { params: { id: "3" }, body: { nom: 'U' } };
    const res = { json: vi.fn() };

    prismaMock.builds.update.mockResolvedValue({ id: 3, nom: 'U' });

    await buildController.updateBuild(req, res);

    expect(res.json).toHaveBeenCalledWith({ id: 3, nom: 'U' });
  });

  it("deleteBuild: supprime build et assets", async () => {
    const req = { params: { id: "4" } };
    const res = { json: vi.fn() };

    prismaMock.asset.deleteMany.mockResolvedValue({ count: 1 });
    prismaMock.builds.delete.mockResolvedValue({});

    await buildController.deleteBuild(req, res);

    expect(prismaMock.asset.deleteMany).toHaveBeenCalledWith({ where: { buildId: 4 } });
    expect(prismaMock.builds.delete).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ message: expect.any(String) }));
  });

  it("createBuild: crée un build avec fichier et version", async () => {
    const req = {
      body: { nom: "TestFile", version: "1.0" },
      file: { filename: "f.zip", originalname: "f.zip", mimetype: "zip", size: 10, path: "p" },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.builds.create.mockResolvedValue({ id: 10, nom: "TestFile" });
    prismaMock.asset.create.mockResolvedValue({ id: 20 });
    prismaMock.builds.update.mockResolvedValue({ id: 10, nom: "TestFile", version: "1.0" });

    await buildController.createBuild(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 10 }));
  });

  it("createBuild: utilise la transaction si disponible", async () => {
    const req = { body: { nom: 'Tx', version: '3.0' }, file: null };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    // Simuler $transaction existant
    prismaMock.$transaction = vi.fn((cb) => cb(prismaMock));

    prismaMock.builds.create.mockResolvedValue({ id: 11, nom: 'Tx' });

    await buildController.createBuild(req, res);

    expect(prismaMock.$transaction).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
  });

  it("addVersion: retourne 400 si version manquante", async () => {
    const handler = buildController.addVersion[1];
    const req = { params: { id: '1' }, body: {}, file: { filename: 'x' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("addVersion: retourne 400 si fichier manquant", async () => {
    const handler = buildController.addVersion[1];
    const req = { params: { id: '1' }, body: { version: '2.0' }, file: null };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("addVersion: retourne 404 si build introuvable", async () => {
    const handler = buildController.addVersion[1];
    const req = { params: { id: '99' }, body: { version: '2.0' }, file: { filename: 'a' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.builds.findUnique.mockResolvedValue(null);

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });
});
