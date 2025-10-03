const express = require('express');
const router = express.Router();
const assetController = require('../controllers/assetController');
const protect = require('../middleware/authMiddleware');
const adminOnly = require('../middleware/adminMiddleware');

// Upload files for a build (admin only)
router.post('/upload/:buildId', protect, adminOnly, assetController.uploadMiddleware, assetController.uploadFiles);

// List files for a build
router.get('/build/:buildId', assetController.getAssetsForBuild);

// Download (open to authenticated users)
router.get('/download/:id', protect, assetController.downloadAsset);

// Delete asset (admin only)
router.delete('/:id', protect, adminOnly, assetController.deleteAsset);

module.exports = router;
