import { describe, it, expect, beforeAll, vi } from "vitest";
import jwt from "jsonwebtoken";
// Note: no DB bootstrap here; this test uses a Prisma mock

let protect;
let mockUser;

// Mock Prisma only for this test to decouple DB flakiness
vi.mock("@prisma/client", () => {
  return {
    PrismaClient: class {
      user = {
        findUnique: vi.fn(async ({ where }) => {
          // Return the mock user when ids match
          if (mockUser && Number(where?.id) === Number(mockUser.id)) {
            return mockUser;
          }
          return null;
        }),
      };
    },
  };
});

describe("Auth Middleware - Integration Tests", () => {
  let token;

  beforeAll(async () => {
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";

    // Prepare a deterministic user returned by mocked Prisma
    mockUser = {
      id: 123,
      username: "Tester",
      email: "test@test.com",
      admin: 0,
    };

    token = jwt.sign({ id: mockUser.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // Import the middleware AFTER the mock is set up
    const mod = await import("../middleware/authMiddleware.js");
    protect = mod.default;
  });

  it("protect → doit valider un token correct", async () => {
    const req = {
      headers: {
        authorization: `Bearer ${token}`,
      },
    };

    const res = {
      status: vi.fn(() => res),
      json: vi.fn(() => res),
    };

    const next = vi.fn();

    await protect(req, res, next);

    expect(next).toHaveBeenCalled();
    expect(req.user).toBeDefined();
    expect(req.user.id).toBe(mockUser.id);
    expect(res.status).not.toHaveBeenCalledWith(401);
  });
});
