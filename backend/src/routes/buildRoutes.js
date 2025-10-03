const express = require("express");
const router = express.Router();
const buildController = require("../controllers/buildController");

// Liste des builds
router.get("/", buildController.getBuilds);
// Créer un build
router.post("/", buildController.createBuild);
// Détail d'un build
router.get("/:id", buildController.getBuildById);
// Modifier un build
router.put("/:id", buildController.updateBuild);
// Supprimer un build
router.delete("/:id", buildController.deleteBuild);

module.exports = router;
