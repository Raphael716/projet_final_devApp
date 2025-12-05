import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

let prismaClient;
function getPrisma() {
  if (!prismaClient) prismaClient = new PrismaClient();
  return prismaClient;
}

const protect = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Non autorisé : token manquant" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "test_secret");

    const prisma = getPrisma();
    const user = await prisma.user.findUnique({
      where: { id: Number(decoded.id) },
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
