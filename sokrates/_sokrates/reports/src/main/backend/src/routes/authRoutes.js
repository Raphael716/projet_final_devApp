const express = require("express");
const router = express.Router();
const { registerUser, loginUser } = require("../controllers/userController");

// Auth routes
router.post("/register", registerUser); // POST /api/auth/register
router.post("/login", loginUser);       // POST /api/auth/login

module.exports = router;
