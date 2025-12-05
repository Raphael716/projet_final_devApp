// backend/src/controllers/userController.js
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, username: true, email: true, admin: true },
    });
    res.json(users);
  } catch (error) {
    console.error("getAllUsers:", error);
    res.status(500).json({ error: "Impossible de récupérer les utilisateurs" });
  }
};

export const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: Number(id) },
      select: { id: true, username: true, email: true, admin: true },
    });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    console.error("getUserById:", error);
    res.status(500).json({ error: "Impossible de récupérer l'utilisateur" });
  }
};

export const createUser = async (req, res) => {
  const { username, email, password, admin } = req.body;
  try {
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) return res.status(400).json({ error: "Email déjà utilisé" });

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        username,
        email,
        password: hashed,
        admin: admin !== undefined ? Number(admin) : 0,
      },
    });
    const { password: _pw, ...safe } = user;
    res.status(201).json(safe);
  } catch (error) {
    console.error("createUser:", error);
    res.status(500).json({ error: "Impossible de créer l'utilisateur" });
  }
};

export const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, admin } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(username !== undefined ? { username } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(admin !== undefined ? { admin: Number(admin) } : {}),
      },
    });
    const { password, ...safe } = updated;
    res.json(safe);
  } catch (error) {
    console.error("updateUser:", error);
    res.status(500).json({ error: "Impossible de modifier l'utilisateur" });
  }
};

export const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("deleteUser:", error);
    res.status(500).json({ error: "Impossible de supprimer l'utilisateur" });
  }
};

// ----------------- Auth (register/login) -----------------

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
  try {
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ error: "Email déjà utilisé" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword, admin: 0 },
    });

    // ✅ Corrigé : utiliser newUser.admin
    // ✅ Pas d'expiration de token
    const token = jwt.sign(
      { id: newUser.id, admin: newUser.admin },
      process.env.JWT_SECRET
    );

    const { password: _pw, ...safe } = newUser;
    res.status(201).json({ user: safe, token });
  } catch (error) {
    console.error("registerUser:", error);
    res.status(500).json({ error: "Impossible de créer l'utilisateur" });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    // ✅ Corrigé : pas d'expiration du token
    const token = jwt.sign(
      { id: user.id, admin: user.admin },
      process.env.JWT_SECRET
    );

    const { password: _pw, ...safe } = user;
    res.json({ user: safe, token });
  } catch (error) {
    console.error("loginUser:", error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
};
