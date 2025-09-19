//const { PrismaClient } = require("../generated/prisma");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ----------------- CRUD utilisateurs -----------------

const getAllUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json(users);
  } catch (error) {
    console.error("Erreur Prisma :", error);
    res.status(500).json({ error: "Impossible de récupérer les utilisateurs" });
  }
};

const createUser = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10); // hash du mot de passe
    const newUser = await prisma.user.create({
      data: { username, email, password: hashedPassword },
    });
    res.status(201).json(newUser);
  } catch (error) {
    console.error("Erreur Prisma :", error);
    res.status(500).json({ error: "Impossible de créer l'utilisateur" });
  }
};

const getUserById = async (req, res) => {
  const { id } = req.params;
  try {
    const user = await prisma.user.findUnique({
      where: { id: parseInt(id) },
    });
    if (!user) return res.status(404).json({ error: "Utilisateur non trouvé" });
    res.json(user);
  } catch (error) {
    console.error("Erreur Prisma :", error);
    res
      .status(500)
      .json({ error: "Erreur lors de la récupération de l'utilisateur" });
  }
};

const deleteUser = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: parseInt(id) } });
    res.json({ message: "Utilisateur supprimé avec succès" });
  } catch (error) {
    console.error("Erreur Prisma :", error);
    res.status(500).json({ error: "Impossible de supprimer l'utilisateur" });
  }
};

// ----------------- Auth (register/login) -----------------

const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ error: "Email déjà utilisé" });
    }

    const hashed = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: { username, email, password: hashed },
    });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    return res.status(201).json({ user, token });
  } catch (error) {
    console.error("REGISTER ERROR:", error); // log simple
    return res.status(500).json({ error: "Impossible de créer l'utilisateur" });
  }
};

const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user)
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ error: "Email ou mot de passe incorrect" });

    const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ user, token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Erreur lors de la connexion" });
  }
};

const updateUser = async (req, res) => {
  const { id } = req.params;
  const { username, email, isAdmin } = req.body;
  try {
    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: {
        ...(username !== undefined ? { username } : {}),
        ...(email !== undefined ? { email } : {}),
        ...(isAdmin !== undefined ? { admin: Number(isAdmin) } : {}),
      },
    });
    res.json(updated);
  } catch (error) {
    console.error("updateUser:", error);
    res.status(500).json({ error: "Impossible de modifier l'utilisateur" });
  }
};

module.exports = {
  getAllUsers,
  createUser,
  getUserById,
  deleteUser,
  registerUser,
  loginUser,
  updateUser,
};
