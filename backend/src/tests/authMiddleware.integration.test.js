import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const prisma = new PrismaClient();

describe("Auth Middleware - Integration Tests", () => {
  let validToken;
  let adminToken;
  let userId;
  let adminId;

  beforeEach(async () => {
    await prisma.user.deleteMany({});

    const passwordHash = await bcrypt.hash("pass123", 10);

    // User standard
    const user = await prisma.user.create({
      data: {
        username: "reg",
        email: "reg@test.com",
        password: passwordHash,
        admin: 0,
      },
    });
    userId = user.id;
    validToken = jwt.sign(
      { id: user.id, admin: 0 },
      process.env.JWT_SECRET || "test_secret"
    );

    // Admin
    const admin = await prisma.user.create({
      data: {
        username: "adm",
        email: "adm@test.com",
        password: passwordHash,
        admin: 1,
      },
    });
    adminId = admin.id;
    adminToken = jwt.sign(
      { id: admin.id, admin: 1 },
      process.env.JWT_SECRET || "test_secret"
    );
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("protect", () => {
    it("doit valider un token correct", async () => {
      const req = { headers: { authorization: `Bearer ${validToken}` } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      await protect(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(userId);
    });
  });

  describe("adminOnly", () => {
    it("doit bloquer un utilisateur non-admin", async () => {
      const req = { user: { id: userId, admin: 0 } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      adminOnly(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it("doit laisser passer un administrateur", async () => {
      const req = { user: { id: adminId, admin: 1 } };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };
      const next = vi.fn();

      adminOnly(req, res, next);

      expect(next).toHaveBeenCalled();
    });
  });
});
