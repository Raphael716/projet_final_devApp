import {
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
  afterAll,
  vi,
} from "vitest";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import * as userController from "../controllers/userController.js";
import { ensureTestDatabase } from "./utils/integrationDb.js";

const prisma = new PrismaClient();

describe("User Controller - Integration Tests", () => {
  beforeAll(async () => {
    await ensureTestDatabase();
  });

  beforeEach(async () => {
    await prisma.user.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("registerUser", () => {
    it("doit créer un nouvel utilisateur en base de données", async () => {
      const req = {
        body: {
          username: "IntegrationUser",
          email: "integration@test.com",
          password: "password123",
        },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await userController.registerUser(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      const userInDb = await prisma.user.findUnique({
        where: { email: "integration@test.com" },
      });
      expect(userInDb).not.toBeNull();
      expect(userInDb.username).toBe("IntegrationUser");
    });
  });

  describe("loginUser", () => {
    it("doit connecter un utilisateur existant", async () => {
      const hashedPassword = await bcrypt.hash("securepass", 10);
      await prisma.user.create({
        data: {
          username: "LoginUser",
          email: "login@test.com",
          password: hashedPassword,
          admin: 0,
        },
      });

      const req = {
        body: { email: "login@test.com", password: "securepass" },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await userController.loginUser(req, res);

      const responseArgs = res.json.mock.calls[0][0];
      expect(responseArgs).toHaveProperty("token");
      expect(responseArgs.user.email).toBe("login@test.com");
    });
  });

  describe("deleteUser", () => {
    it("doit supprimer un utilisateur de la base", async () => {
      const user = await prisma.user.create({
        data: {
          username: "ToDelete",
          email: "delete@test.com",
          password: "hash",
          admin: 0,
        },
      });

      const req = { params: { id: String(user.id) } };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await userController.deleteUser(req, res);

      const check = await prisma.user.findUnique({ where: { id: user.id } });
      expect(check).toBeNull();
    });
  });
});
