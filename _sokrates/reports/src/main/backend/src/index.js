import express from "express";
import cors from "cors";
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

// ----------------- Import Prisma -----------------
const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Augmenter les timeouts
app.use((req, res, next) => {
  res.setTimeout(120000);
  next();
});

// Routes
import authRoutes from "./routes/authRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import buildRoutes from "./routes/buildRoutes.js";
import assetRoutes from "./routes/assetRoutes.js";
app.use("/api/builds", buildRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/assets", assetRoutes);

// Serve uploads folder (optional, downloads use controlled endpoint)
app.use("/uploads", express.static("uploads"));

// Route racine
app.get("/", (req, res) => {
  res.json({ message: "Backend Express en marche 🚀" });
});

// Test DB
app.get("/test-db", async (req, res) => {
  try {
    // simple test to ensure Prisma client can connect
    await prisma.$connect();
    res.json({
      success: true,
      message: "Connexion à la DB OK",
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

// (routes already mounted above)

// Démarrage serveur
app.listen(PORT, () => {
  console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
});

prisma
  .$connect()
  .then(() => console.log("✅ Prisma connecté à la base"))
  .catch((err) => console.error("❌ Prisma erreur connexion:", err));
