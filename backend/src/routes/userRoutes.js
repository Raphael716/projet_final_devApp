const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const protect = require("../middleware/authMiddleware");
const adminOnly = require("../middleware/adminMiddleware");

// Routes utilisateurs
router.get("/", protect, userController.getAllUsers); // GET /api/users
router.post("/", userController.createUser); // POST /api/users
router.get("/:id", userController.getUserById); // GET /api/users/:id
router.delete("/:id", userController.deleteUser); // DELETE /api/users/:id

module.exports = router;
