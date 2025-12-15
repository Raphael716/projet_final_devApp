import { describe, it, expect, vi, beforeEach } from "vitest";

const { prismaMock, fsMock, streamMock } = vi.hoisted(() => {
  const stream = {
    pipe: vi.fn(),
    on: vi.fn(),
  };

  return {
    streamMock: stream,
    prismaMock: {
      builds: {
        findUnique: vi.fn(),
        update: vi.fn(),
      },
      asset: {
        create: vi.fn(),
        findMany: vi.fn(),
        findUnique: vi.fn(),
        delete: vi.fn(),
      },
    },
    fsMock: {
      existsSync: vi.fn(() => true),
      mkdirSync: vi.fn(),
      accessSync: vi.fn(),
      unlinkSync: vi.fn(),
      promises: {
        access: vi.fn(() => Promise.resolve()),
      },
      constants: { R_OK: 4, W_OK: 2 },
      createReadStream: vi.fn(() => stream),
    },
  };
});

const multerControls = vi.hoisted(() => {
  class MulterError extends Error {
    constructor(code, message = "Multer error") {
      super(message);
      this.code = code;
      this.name = "MulterError";
    }
  }

  const state = {
    handler: null,
    options: null,
    storageConfig: null,
    lastField: null,
  };

  const multerFn = vi.fn((options = {}) => {
    state.options = options;
    return {
      single: vi.fn((field) => {
        state.lastField = field;
        return (req, res, cb) => {
          if (state.handler) {
            return state.handler(req, res, cb);
          }
          cb();
        };
      }),
    };
  });

  multerFn.diskStorage = vi.fn((config) => {
    state.storageConfig = config;
    return config;
  });
  multerFn.MulterError = MulterError;

  return { state, multerFn };
});

vi.mock("@prisma/client", () => ({
  PrismaClient: class {
    constructor() {
      return prismaMock;
    }
  },
}));

vi.mock("fs", () => ({
  default: fsMock,
  ...fsMock,
  promises: fsMock.promises,
  constants: fsMock.constants,
  createReadStream: fsMock.createReadStream,
}));

vi.mock("multer", () => ({
  __esModule: true,
  default: multerControls.multerFn,
}));

import * as assetController from "../controllers/assetController.js";

describe("assetController", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fsMock.existsSync.mockReturnValue(true);
    fsMock.accessSync.mockImplementation(() => {});
    fsMock.promises.access.mockResolvedValue();
    fsMock.createReadStream.mockReturnValue(streamMock);
    prismaMock.builds.findUnique.mockResolvedValue({ id: 1 });
    multerControls.state.handler = null;
  });

  const makeRes = () => ({
    status: vi.fn().mockReturnThis(),
    json: vi.fn(),
    setHeader: vi.fn(),
    headersSent: false,
    send: vi.fn(),
  });

  describe("stockage multer", () => {
    it("destination → crée le dossier manquant et vérifie les permissions", () => {
      const destination = multerControls.state.storageConfig.destination;
      const cb = vi.fn();

      fsMock.existsSync.mockReturnValueOnce(false);

      destination({}, {}, cb);

      expect(fsMock.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
        recursive: true,
      });
      expect(fsMock.accessSync).toHaveBeenCalledWith(
        expect.any(String),
        fsMock.constants.W_OK
      );
      expect(cb).toHaveBeenCalledWith(null, expect.any(String));
    });

    it("destination → remonte une erreur de permission", () => {
      const destination = multerControls.state.storageConfig.destination;
      const cb = vi.fn();

      fsMock.accessSync.mockImplementationOnce(() => {
        throw new Error("no access");
      });

      destination({}, {}, cb);

      expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(cb.mock.calls[0][0].message).toContain("Pas de permission");
    });

    it("filename → génère un nom avec l'extension source", () => {
      const filenameFn = multerControls.state.storageConfig.filename;
      const cb = vi.fn();

      filenameFn({}, { originalname: "archive.zip" }, cb);

      expect(cb).toHaveBeenCalledWith(null, expect.stringMatching(/\.zip$/));
    });

    it("filename → renvoie une erreur sans extension", () => {
      const filenameFn = multerControls.state.storageConfig.filename;
      const cb = vi.fn();

      filenameFn({}, { originalname: "" }, cb);

      expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(cb.mock.calls[0][0].message).toContain("extension");
    });

    it("fileFilter → accepte les extensions valides", () => {
      const fileFilter = multerControls.state.options.fileFilter;
      const cb = vi.fn();

      fileFilter({}, { originalname: "notes.txt" }, cb);

      expect(cb).toHaveBeenCalledWith(null, true);
    });

    it("fileFilter → refuse l'absence d'extension", () => {
      const fileFilter = multerControls.state.options.fileFilter;
      const cb = vi.fn();

      fileFilter({}, { originalname: "" }, cb);

      expect(cb.mock.calls[0][0]).toBeInstanceOf(Error);
    });
  });

  describe("uploadMiddleware", () => {
    it("retourne 400 quand la taille dépasse la limite", () => {
      const MulterError = multerControls.multerFn.MulterError;
      multerControls.state.handler = (req, res, cb) =>
        cb(new MulterError("LIMIT_FILE_SIZE", "too big"));

      const res = makeRes();
      const next = vi.fn();

      assetController.uploadMiddleware({}, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("50MB") })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("retourne 500 pour une erreur inattendue", () => {
      multerControls.state.handler = (req, res, cb) => cb(new Error("boom"));

      const res = makeRes();
      const next = vi.fn();

      assetController.uploadMiddleware({}, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("inattendue") })
      );
    });

    it("retourne 400 pour les autres erreurs multer", () => {
      const MulterError = multerControls.multerFn.MulterError;
      multerControls.state.handler = (req, res, cb) =>
        cb(new MulterError("LIMIT_UNEXPECTED_FILE", "bad"));

      const res = makeRes();
      const next = vi.fn();

      assetController.uploadMiddleware({}, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.stringContaining("Erreur upload") })
      );
      expect(next).not.toHaveBeenCalled();
    });

    it("continue lorsqu'aucune erreur n'est levée", () => {
      multerControls.state.handler = (req, res, cb) => cb(null);

      const res = makeRes();
      const next = vi.fn();

      assetController.uploadMiddleware({}, res, next);

      expect(next).toHaveBeenCalled();
    });
  });


  it("uploadFiles → 400 lorsque l'id est invalide", async () => {
    const req = { params: { buildId: "abc" }, body: {}, file: null };
    const res = makeRes();

    await assetController.uploadFiles(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("uploadFiles → 400 lorsque la version est absente", async () => {
    const req = {
      params: { buildId: "1" },
      body: { version: "" },
      file: { filename: "f" },
    };
    const res = makeRes();

    await assetController.uploadFiles(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("uploadFiles → 400 sans fichier", async () => {
    const req = {
      params: { buildId: "1" },
      body: { version: "1.0" },
      file: null,
    };
    const res = makeRes();

    await assetController.uploadFiles(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("uploadFiles → 404 si le build n'existe pas", async () => {
    prismaMock.builds.findUnique.mockResolvedValue(null);

    const req = {
      params: { buildId: "1" },
      body: { version: "1.0" },
      file: { filename: "release.zip" },
    };
    const res = makeRes();

    await assetController.uploadFiles(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("uploadFiles → crée un asset et retourne success", async () => {
    prismaMock.builds.findUnique.mockResolvedValue({ id: 1 });
    prismaMock.asset.create.mockResolvedValue({
      id: 10,
      filename: "release.zip",
      version: "2.0.0",
    });
    prismaMock.builds.update.mockResolvedValue({ id: 1, version: "2.0.0" });

    const req = {
      params: { buildId: "1" },
      body: { version: "2.0.0", description: "Notes" },
      file: {
        filename: "stored.zip",
        originalname: "release.zip",
        mimetype: "application/octet-stream",
        size: 1024,
        path: "uploads/stored.zip",
      },
    };
    const res = makeRes();

    await assetController.uploadFiles(req, res);

    expect(prismaMock.asset.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          mimetype: "application/zip",
          version: "2.0.0",
        }),
      })
    );
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it("uploadFiles → crée le dossier uploads si nécessaire", async () => {
    prismaMock.asset.create.mockResolvedValue({ id: 20 });
    prismaMock.builds.update.mockResolvedValue({ id: 1, version: "1.1.0" });
    fsMock.existsSync.mockReturnValueOnce(false);

    const req = {
      params: { buildId: "1" },
      body: { version: "1.1.0", description: "" },
      file: {
        filename: "stored.zip",
        originalname: "release.zip",
        mimetype: "application/octet-stream",
        size: 1024,
        path: "uploads/stored.zip",
      },
    };
    const res = makeRes();

    await assetController.uploadFiles(req, res);

    expect(fsMock.mkdirSync).toHaveBeenCalledWith(expect.any(String), {
      recursive: true,
    });
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
  });

  it("uploadFiles → nettoie le fichier et renvoie 500 si la création échoue", async () => {
    prismaMock.asset.create.mockRejectedValue(new Error("DB"));

    const req = {
      params: { buildId: "1" },
      body: { version: "3.0.0", description: "" },
      file: {
        filename: "stored.zip",
        originalname: "release.zip",
        mimetype: "application/octet-stream",
        size: 1024,
        path: "uploads/stored.zip",
      },
    };
    const res = makeRes();

    await assetController.uploadFiles(req, res);

    expect(fsMock.unlinkSync).toHaveBeenCalledWith("uploads/stored.zip");
    expect(res.status).toHaveBeenCalledWith(500);
  });

  it("getAssetsByBuild → applique un label lisible", async () => {
    prismaMock.asset.findMany.mockResolvedValue([
      {
        id: 1,
        original: "notes.txt",
        filename: "notes.txt",
        mimetype: "text/plain",
        size: 10,
        path: "uploads/notes.txt",
        buildId: 2,
        version: "v1",
        createdAt: new Date().toISOString(),
      },
    ]);

    const req = { params: { id: "2" } };
    const res = makeRes();

    await assetController.getAssetsByBuild(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ displayType: "Fichier texte" }),
      ])
    );
  });

  it("getAssetsByBuild → 500 en cas d'erreur", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.asset.findMany.mockRejectedValue(new Error("DB"));

    const res = makeRes();

    await assetController.getAssetsByBuild({ params: { id: "2" } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });

  it("getAssetById → 404 si introuvable", async () => {
    prismaMock.asset.findUnique.mockResolvedValue(null);

    const res = makeRes();

    await assetController.getAssetById({ params: { id: "9" } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("getAssetById → ajoute un label", async () => {
    prismaMock.asset.findUnique.mockResolvedValue({
      id: 9,
      original: "doc.pdf",
      filename: "doc.pdf",
      mimetype: "application/pdf",
      path: "uploads/doc.pdf",
    });

    const res = makeRes();

    await assetController.getAssetById({ params: { id: "9" } }, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ displayType: "Fichier PDF" })
    );
  });

  it("getAssetById → 500 en cas d'erreur base", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.asset.findUnique.mockRejectedValue(new Error("DB"));

    const res = makeRes();

    await assetController.getAssetById({ params: { id: "9" } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });

  it("downloadAsset → stream le fichier quand il existe", async () => {
    prismaMock.asset.findUnique.mockResolvedValue({
      id: 3,
      filename: "file.log",
      original: "file.log",
      mimetype: "",
      path: "uploads/file.log",
    });

    const res = makeRes();

    await assetController.downloadAsset({ params: { id: "3" } }, res);

    expect(fsMock.createReadStream).toHaveBeenCalledWith("uploads/file.log");
    expect(streamMock.pipe).toHaveBeenCalledWith(res);
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Type",
      "application/octet-stream"
    );
  });

  it("downloadAsset → 404 si l'asset est introuvable", async () => {
    prismaMock.asset.findUnique.mockResolvedValue(null);

    const res = makeRes();

    await assetController.downloadAsset({ params: { id: "7" } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("downloadAsset → 404 si le fichier n'existe plus", async () => {
    prismaMock.asset.findUnique.mockResolvedValue({
      id: 11,
      filename: "ghost.zip",
      original: "ghost.zip",
      mimetype: "",
      path: "uploads/ghost.zip",
    });
    fsMock.existsSync.mockImplementation(() => false);

    const res = makeRes();

    await assetController.downloadAsset({ params: { id: "11" } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("downloadAsset → 403 lorsque l'accès disque est refusé", async () => {
    prismaMock.asset.findUnique.mockResolvedValue({
      id: 5,
      filename: "private.zip",
      original: "private.zip",
      mimetype: "",
      path: "uploads/private.zip",
    });
    fsMock.promises.access.mockRejectedValueOnce(new Error("no access"));

    const res = makeRes();

    await assetController.downloadAsset({ params: { id: "5" } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
  });

  it("downloadAsset → 500 lorsque le stream échoue", async () => {
    prismaMock.asset.findUnique.mockResolvedValue({
      id: 6,
      filename: "stream.bin",
      original: "stream.bin",
      mimetype: "",
      path: "uploads/stream.bin",
    });

    const errorStream = {
      pipe: vi.fn(),
      on: vi.fn((event, handler) => {
        if (event === "error") {
          handler(new Error("boom"));
        }
      }),
    };

    fsMock.createReadStream.mockReturnValueOnce(errorStream);

    const res = makeRes();

    await assetController.downloadAsset({ params: { id: "6" } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "Erreur lors de la lecture du fichier" })
    );
  });

  it("downloadAsset → 500 si la récupération échoue", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.asset.findUnique.mockRejectedValue(new Error("DB"));

    const res = makeRes();

    await assetController.downloadAsset({ params: { id: "6" } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });

  it("deleteAsset → supprime le fichier et la ligne", async () => {
    prismaMock.asset.findUnique.mockResolvedValue({
      id: 4,
      path: "uploads/file.log",
    });

    const res = makeRes();

    await assetController.deleteAsset({ params: { id: "4" } }, res);

    expect(fsMock.unlinkSync).toHaveBeenCalledWith("uploads/file.log");
    expect(prismaMock.asset.delete).toHaveBeenCalledWith({ where: { id: 4 } });
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ success: true }));
  });

  it("deleteAsset → 404 si l'asset n'existe pas", async () => {
    prismaMock.asset.findUnique.mockResolvedValue(null);

    const res = makeRes();

    await assetController.deleteAsset({ params: { id: "8" } }, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("deleteAsset → ne tente pas de supprimer un fichier absent", async () => {
    prismaMock.asset.findUnique.mockResolvedValue({ id: 12, path: null });

    const res = makeRes();

    await assetController.deleteAsset({ params: { id: "12" } }, res);

    expect(fsMock.unlinkSync).not.toHaveBeenCalled();
    expect(prismaMock.asset.delete).toHaveBeenCalledWith({ where: { id: 12 } });
  });

  it("deleteAsset → 500 lorsque la base échoue", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    prismaMock.asset.findUnique.mockRejectedValue(new Error("DB"));

    const res = makeRes();

    await assetController.deleteAsset({ params: { id: "12" } }, res);

    expect(res.status).toHaveBeenCalledWith(500);
    consoleSpy.mockRestore();
  });
});
