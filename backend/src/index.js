const express = require("express");
const cors = require("cors");
require("dotenv").config();

// ----------------- Import Prisma -----------------
//const prisma = require("./config/db");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);

// Route racine
app.get("/", (req, res) => {
  res.json({ message: "Backend Express en marche 🚀" });
});

// ----------------- Test DB -----------------
app.get("/test-db", async (req, res) => {
  try {
    const result = await prisma.user.findFirst(); // essaie de récupérer un utilisateur
    res.json({
      success: true,
      message: "Connexion à la DB OK",
      sampleUser: result,
    });
  } catch (error) {
    console.error("Erreur DB :", error);
    res.status(500).json({
      success: false,
      message: "Impossible de se connecter à la DB",
      error: error.message,
    });
  }
});

// Démarrage serveur
app.listen(PORT, "0.0.0.0", () => {
  console.log("✅ Serveur démarré sur http://0.0.0.0:${PORT}");
});

prisma
  .$connect()
  .then(() => console.log("✅ Prisma connecté à la base"))
  .catch((err) => console.error("❌ Prisma erreur connexion:", err));
