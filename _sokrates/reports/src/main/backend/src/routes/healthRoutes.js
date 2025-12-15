// backend/src/routes/healthRoutes.js
import express from "express";

const router = express.Router();

// Health check endpoint pour CI/CD et monitoring
router.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Readiness check - vérifie que l'app est prête
router.get("/ready", async (req, res) => {
  try {
    res.status(200).json({
      status: "ready",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(503).json({
      status: "not ready",
      error: error.message
    });
  }
});

export default router;