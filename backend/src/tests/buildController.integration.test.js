import { describe, it, expect, beforeEach, afterAll, vi } from "vitest";
import { PrismaClient } from "@prisma/client";
import * as buildController from "../controllers/buildController.js";

const prisma = new PrismaClient();

describe("Build Controller - Integration Tests", () => {
  beforeEach(async () => {
    await prisma.asset.deleteMany({});
    await prisma.builds.deleteMany({});
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe("createBuild", () => {
    it("doit insérer un nouveau build en base", async () => {
      const req = {
        body: {
          nom: "Alpha Build",
          description: "Integration test build",
          version: "0.0.1",
          statut: "dev",
          proprietaire: "QA",
        },
      };
      const res = { status: vi.fn().mockReturnThis(), json: vi.fn() };

      await buildController.createBuild(req, res);

      expect(res.status).toHaveBeenCalledWith(201);

      const inDb = await prisma.builds.findFirst({
        where: { nom: "Alpha Build" },
      });
      expect(inDb).not.toBeNull();
    });
  });

  describe("addVersion", () => {
    it("doit mettre à jour le build et créer un asset", async () => {
      const build = await prisma.builds.create({
        data: { nom: "App", version: "1.0", statut: "prod" },
      });

      // Gestion du tableau de middlewares pour addVersion
      const handler = Array.isArray(buildController.addVersion)
        ? buildController.addVersion[buildController.addVersion.length - 1]
        : buildController.addVersion;

      const req = {
        params: { id: String(build.id) },
        body: { version: "2.0", description: "Update" },
        file: {
          filename: "update.zip",
          originalname: "app.zip",
          mimetype: "application/zip",
          size: 1024,
          path: "uploads/update.zip",
        },
      };
      const res = { json: vi.fn(), status: vi.fn().mockReturnThis() };

      await handler(req, res);

      const response = res.json.mock.calls[0][0];
      expect(response.success).toBe(true);

      const updated = await prisma.builds.findUnique({
        where: { id: build.id },
      });
      expect(updated.version).toBe("2.0");
    });
  });
});
