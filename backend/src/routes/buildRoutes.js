const express = require("express");
const router = express.Router();
const buildController = require("../controllers/buildController");
const assetController = require("../controllers/assetController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

router.get("/", async (req, res) => {
  try {
    const { PrismaClient } = require("@prisma/client");
    const prisma = new PrismaClient();

    const builds = await prisma.builds.findMany({
      include: {
        assets: {
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

    res.json(builds);
  } catch (err) {
    console.error("Erreur route GET /api/builds :", err);
    res
      .status(500)
      .json({ error: "Erreur interne serveur lors du chargement des builds" });
  }
});

// Créer un build
router.post("/", buildController.createBuild);

// Détail d'un build
router.get("/:id", buildController.getBuildById);

// Modifier un build
router.put("/:id", buildController.updateBuild);

// Supprimer un build
router.delete("/:id", buildController.deleteBuild);

// upload fichier + version (admin uniquement)
router.post(
  "/:id/add-version",
  protect,
  adminOnly,
  assetController.uploadMiddleware,
  assetController.uploadFiles
);

module.exports = router;
