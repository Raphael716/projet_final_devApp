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
});
