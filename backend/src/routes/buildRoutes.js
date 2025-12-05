import express from "express";
import { PrismaClient } from "@prisma/client";
import * as buildController from "../controllers/buildController.js";
import * as assetController from "../controllers/assetController.js";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();
const prisma = new PrismaClient();

router.get("/", async (req, res) => {
  try {
    const builds = await prisma.builds.findMany({
      include: {
        asset: {
          select: {
            id: true,
            original: true,
            version: true,
            size: true,
            createdAt: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = builds.map(({ asset, ...rest }) => ({
      ...rest,
      assets: asset,
    }));

    res.json(formatted);
  } catch (err) {
    console.error("Erreur route GET /api/builds :", err);
    res
      .status(500)
      .json({ error: "Erreur interne serveur lors du chargement des builds" });
  }
});

router.post("/", buildController.parseBuildFile, buildController.createBuild);
router.get("/:id", buildController.getBuildById);
router.put("/:id", buildController.updateBuild);
router.delete("/:id", buildController.deleteBuild);

router.post(
  "/:id/add-version",
  protect,
  adminOnly,
  assetController.uploadMiddleware,
  assetController.uploadFiles
);

export default router;
