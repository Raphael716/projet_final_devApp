const app = require("./app");
require("dotenv").config();

// ----------------- Import Prisma -----------------
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const PORT = process.env.PORT || 4000;

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});

prisma
  .$connect()
  .then(() => console.log("✅ Prisma connecté à la base"))
  .catch((err) => console.error("❌ Prisma erreur connexion:", err));
