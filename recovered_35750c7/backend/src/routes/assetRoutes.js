import express from "express";
import * as assetController from "../controllers/assetController.js";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

// Upload files for a build (admin only)
router.post(
  "/upload/:buildId",
  protect,
  adminOnly,
  assetController.uploadMiddleware,
  assetController.uploadFiles
);

// List files for a build
router.get("/build/:id", assetController.getAssetsByBuild);
// Get single asset details
router.get("/:id", assetController.getAssetById);
// Download (open to authenticated users)
router.get("/download/:id", protect, assetController.downloadAsset);

// Delete asset (admin only)
router.delete("/:id", protect, adminOnly, assetController.deleteAsset);

export default router;
