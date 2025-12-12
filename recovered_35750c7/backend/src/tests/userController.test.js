import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. HOISTED : On prépare les variables de mock AVANT tout le reste
const { prismaMock, bcryptMock, jwtMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      user: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
      },
    },
    bcryptMock: {
      hash: vi.fn(),
      compare: vi.fn(),
    },
    jwtMock: {
      sign: vi.fn(),
    },
  };
});

// 2. MOCKING : On intercepte les modules
vi.mock("@prisma/client", () => {
  return {
    PrismaClient: class {
      constructor() {
        return prismaMock;
      }
    },
  };
});

vi.mock("bcryptjs", () => ({
  default: bcryptMock,
  ...bcryptMock,
}));

vi.mock("jsonwebtoken", () => ({
  default: jwtMock,
  ...jwtMock,
}));

// 3. IMPORT : On importe le contrôleur (qui recevra maintenant les mocks)
import * as userController from "../controllers/userController.js";

describe("User Controller", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Comportements par défaut
    bcryptMock.compare.mockResolvedValue(true);
    bcryptMock.hash.mockResolvedValue("hashed_secret");
    jwtMock.sign.mockReturnValue("fake-jwt-token");
    prismaMock.user.findUnique.mockResolvedValue(null);
  });

  it("getAllUsers: doit récupérer les utilisateurs", async () => {
    const req = {};
    const res = { json: vi.fn() };
    const mockUsers = [{ id: 1, username: "Test" }];

    prismaMock.user.findMany.mockResolvedValue(mockUsers);

    await userController.getAllUsers(req, res);

    expect(res.json).toHaveBeenCalledWith(mockUsers);
  });

  it("registerUser: doit créer un utilisateur", async () => {
    const req = {
      body: { username: "New", email: "new@test.com", password: "123" },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 1,
      email: "new@test.com",
      password: "hash",
      admin: 0,
    });

    await userController.registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "fake-jwt-token" })
    );
  });

  it("loginUser: doit connecter l'utilisateur", async () => {
    const req = { body: { email: "admin@test.com", password: "pass" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: "admin@test.com",
      password: "hash",
      admin: 1,
    });

    await userController.loginUser(req, res);

    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "fake-jwt-token" })
    );
  });

  it("deleteUser: doit supprimer un utilisateur", async () => {
    const req = { params: { id: "5" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.user.delete.mockResolvedValue({});

    await userController.deleteUser(req, res);

    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(res.json).toHaveBeenCalledWith(expect.anything());
  });

  it("createUser: retourne 400 si email déjà utilisé", async () => {
    const req = { body: { username: "Dup", email: "dup@test.com", password: "p" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.user.findUnique.mockResolvedValue({ id: 2, email: "dup@test.com" });

    await userController.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ error: expect.any(String) }));
  });

  it("createUser: crée un utilisateur (admin valeur par défaut)", async () => {
    const req = { body: { username: 'C', email: 'c@test.com', password: 'p' } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({ id: 7, username: 'C', email: 'c@test.com', password: 'hash', admin: 0 });

    await userController.createUser(req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 7, username: 'C' }));
  });

  it("registerUser: retourne 400 si user existant", async () => {
    const req = { body: { username: "Ex", email: "ex@test.com", password: "p" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.user.findUnique.mockResolvedValue({ id: 3, email: "ex@test.com" });

    await userController.registerUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("loginUser: retourne 400 si utilisateur introuvable", async () => {
    const req = { body: { email: "noone@test.com", password: "p" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.user.findUnique.mockResolvedValue(null);

    await userController.loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("loginUser: retourne 400 si mot de passe incorrect", async () => {
    const req = { body: { email: "u@test.com", password: "bad" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.user.findUnique.mockResolvedValue({ id: 4, email: "u@test.com", password: "hash" });
    bcryptMock.compare.mockResolvedValue(false);

    await userController.loginUser(req, res);

    expect(res.status).toHaveBeenCalledWith(400);
  });

  it("getUserById: retourne 404 si non trouvé", async () => {
    const req = { params: { id: "999" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.user.findUnique.mockResolvedValue(null);

    await userController.getUserById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
  });

  it("updateUser: doit modifier un utilisateur", async () => {
    const req = { params: { id: "2" }, body: { username: "Up" } };
    const res = { json: vi.fn() };

    prismaMock.user.update.mockResolvedValue({ id: 2, username: "Up", email: "up@test.com" });

    await userController.updateUser(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 2 }));
  });

  it("updateUser: modifie email et admin", async () => {
    const req = { params: { id: '8' }, body: { email: 'new@test.com', admin: '1' } };
    const res = { json: vi.fn() };

    prismaMock.user.update.mockResolvedValue({ id: 8, email: 'new@test.com', admin: 1 });

    await userController.updateUser(req, res);

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ id: 8, admin: 1 }));
  });
});
