import { describe, it, expect, vi, beforeEach, beforeAll } from "vitest";

// Définition des objets mocks
const prismaMock = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
};

const bcryptMock = {
  hash: vi.fn().mockResolvedValue("hashed_password_secret"),
  compare: vi.fn().mockResolvedValue(true),
};

const jwtMock = {
  sign: vi.fn().mockReturnValue("fake-jwt-token"),
};

describe("User Controller", () => {
  let userController;
  let bcrypt;
  let jwt;

  // INITIALISATION ASYNCHRONE DES MOCKS
  beforeAll(async () => {
    // 1. On force le mock du client Prisma
    vi.doMock("@prisma/client", () => ({
      PrismaClient: vi.fn(() => prismaMock),
    }));

    // 2. On force le mock de bcryptjs
    vi.doMock("bcryptjs", () => ({
      default: bcryptMock,
      ...bcryptMock, // Pour gérer l'import nommé ou par défaut
    }));

    // 3. On force le mock de jsonwebtoken
    vi.doMock("jsonwebtoken", () => ({
      default: jwtMock,
      ...jwtMock,
    }));

    // 4. On importe le contrôleur APRÈS avoir défini les mocks
    // C'est la clé : Vitest va intercepter les 'require' à l'intérieur de ce fichier
    userController = await import("../controllers/userController");

    // On récupère aussi les libs pour pouvoir espionner leurs appels
    bcrypt = await import("bcryptjs");
    jwt = await import("jsonwebtoken");
  });

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset des comportements par défaut
    bcryptMock.compare.mockResolvedValue(true);
    prismaMock.user.findUnique.mockResolvedValue(null);
  });

  // --- TESTS ---

  it("getAllUsers: doit récupérer et retourner tous les utilisateurs", async () => {
    const req = {};
    const res = { json: vi.fn() };
    const mockUsers = [{ id: 1, username: "Test" }];

    prismaMock.user.findMany.mockResolvedValue(mockUsers);

    await userController.getAllUsers(req, res);

    expect(prismaMock.user.findMany).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(mockUsers);
  });

  it("registerUser: doit créer un utilisateur et renvoyer un token", async () => {
    const req = {
      body: { username: "New", email: "new@test.com", password: "123" },
    };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    // Simulation succès création
    prismaMock.user.findUnique.mockResolvedValue(null);
    prismaMock.user.create.mockResolvedValue({
      id: 1,
      username: "New",
      email: "new@test.com",
      password: "hash",
      admin: 0,
    });

    await userController.registerUser(req, res);

    expect(bcryptMock.hash).toHaveBeenCalledWith("123", 10);
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "fake-jwt-token" })
    );
  });

  it("loginUser: doit connecter l'utilisateur", async () => {
    const req = { body: { email: "admin@test.com", password: "password" } };
    const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

    prismaMock.user.findUnique.mockResolvedValue({
      id: 1,
      email: "admin@test.com",
      password: "hash",
      admin: 1,
    });
    bcryptMock.compare.mockResolvedValue(true);

    await userController.loginUser(req, res);

    expect(jwtMock.sign).toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ token: "fake-jwt-token" })
    );
  });

  it("deleteUser: doit supprimer un utilisateur sans toucher la vraie BDD", async () => {
    const req = { params: { id: "5" } };
    const res = { json: vi.fn() };

    prismaMock.user.delete.mockResolvedValue({});

    await userController.deleteUser(req, res);

    expect(prismaMock.user.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    expect(res.json).toHaveBeenCalledWith({
      message: "Utilisateur supprimé avec succès",
    });
  });
});
