import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

export default function adminOnly(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({ error: "Non autorisé" });
    }

    if (req.user.admin !== 1) {
      return res.status(403).json({ error: "Réservé aux administrateurs" });
    }

    next();
  } catch (e) {
    console.error("adminOnly:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
}
