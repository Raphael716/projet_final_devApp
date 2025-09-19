const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

module.exports = async function adminOnly(req, res, next) {
  try {
    if (!req.user?.id) return res.status(401).json({ error: "Non autorisé" });

    const me = await prisma.user.findUnique({
      where: { id: Number(req.user.id) },
    });

    if (!me || me.admin !== 1)
      return res.status(403).json({ error: "Réservé aux admins" });

    next();
  } catch (e) {
    console.error("adminOnly:", e);
    res.status(500).json({ error: "Erreur serveur" });
  }
};
