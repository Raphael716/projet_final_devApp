import { describe, it, expect, beforeAll, vi } from "vitest";
import jwt from "jsonwebtoken";
import protect from "../middleware/authMiddleware.js";
import { PrismaClient } from "@prisma/client";
import { ensureTestDatabase } from "./utils/integrationDb.js";

const prisma = new PrismaClient();

describe("Auth Middleware - Integration Tests", () => {
  let user;
  let token;

  beforeAll(async () => {
    // Ensure middleware and test use the same secret
    process.env.JWT_SECRET = process.env.JWT_SECRET || "test_secret";

    await ensureTestDatabase();
    await prisma.user.deleteMany();

    user = await prisma.user.create({
      data: {
        username: "Tester",
        email: "test@test.com",
        password: "hashedpwd",
        admin: 0,
      },
    });

    token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
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
    expect(req.user.id).toBe(user.id);
    expect(res.status).not.toHaveBeenCalledWith(401);
  });
});
