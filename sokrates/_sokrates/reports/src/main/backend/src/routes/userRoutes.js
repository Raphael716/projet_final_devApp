// src/routes/userRoutes.js
const express = require("express");
const router = express.Router();

const userController = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const adminOnly = (req, res, next) => {
  if (!req.user || req.user.admin !== 1) {
    return res.status(403).json({ error: "Réservé aux admins" });
  }
  next();
};

// Admin requis pour LIRE / ÉDITER / SUPPRIMER
router.get("/", protect, adminOnly, userController.getAllUsers); // GET /api/users
router.get("/:id", protect, adminOnly, userController.getUserById); // GET /api/users/:id
router.put("/:id", protect, adminOnly, userController.updateUser); // PUT /api/users/:id
router.delete("/:id", protect, adminOnly, userController.deleteUser); // DELETE /api/users/:id

// (optionnel) création libre si tu l’utilises côté seed/test
router.post("/", userController.createUser); // POST /api/users

module.exports = router;
