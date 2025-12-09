import express from "express";
import { registerUser, loginUser } from "../controllers/userController.js";

const router = express.Router();

// Auth routes
router.post("/register", registerUser); // POST /api/auth/register
router.post("/login", loginUser); // POST /api/auth/login

export default router;
