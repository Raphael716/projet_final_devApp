import { describe, it, expect, vi, beforeEach } from "vitest";

// 1. HOISTED
const { prismaMock, jwtMock } = vi.hoisted(() => {
  return {
    prismaMock: {
      user: {
        findUnique: vi.fn(),
      },
    },
    jwtMock: {
      verify: vi.fn(),
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

vi.mock("jsonwebtoken", () => ({
  default: jwtMock,
  ...jwtMock,
}));

// 3. IMPORT
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

describe("Middlewares", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Auth Middleware (protect)", () => {
    it("doit bloquer l'accès sans header Authorization", async () => {
      const req = { headers: {} };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await protect(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(next).not.toHaveBeenCalled();
    });
  });

  describe("Admin Middleware (adminOnly)", () => {
    it("doit laisser passer un administrateur", () => {
      const req = { user: { id: 1, admin: 1 } };
      const res = {};
      const next = vi.fn();

      adminOnly(req, res, next);
      expect(next).toHaveBeenCalled();
    });

    it("doit bloquer un utilisateur non-admin", () => {
      const req = { user: { id: 2, admin: 0 } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      adminOnly(req, res, next);
      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });
  });
});
