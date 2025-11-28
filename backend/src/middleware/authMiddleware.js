import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non autorisé : token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "test_secret");

    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: { id: true, username: true, email: true, admin: true },
    });

    if (!user) {
      return res.status(401).json({ error: "Utilisateur introuvable" });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token invalide" });
  }
};

export default protect;
