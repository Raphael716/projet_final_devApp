const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const path = require("path");
const fs = require("fs");
const multer = require("multer");

// === Dossier d’upload ===
const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// === Configuration Multer ===
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, unique + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// === TES FONCTIONS EXISTANTES ===============================
exports.getBuilds = async (req, res) => {
  try {
    const builds = await prisma.builds.findMany({
      orderBy: { updatedAt: "desc" },
    });
    res.json(builds);
  } catch (err) {
    console.error("getBuilds error:", err);
    res.status(500).json({ error: "Erreur récupération builds" });
  }
};

exports.getBuildById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const build = await prisma.builds.findUnique({ where: { id } });
    if (!build) return res.status(404).json({ error: "Build non trouvé" });
    res.json(build);
  } catch (err) {
    console.error("getBuildById error:", err);
    res.status(500).json({ error: "Erreur récupération build" });
  }
};

exports.createBuild = async (req, res) => {
  try {
    const { nom, description, version, statut, proprietaire } = req.body;
    const newBuild = await prisma.builds.create({
      data: { nom, description, version, statut, proprietaire },
    });
    res.status(201).json(newBuild);
  } catch (err) {
    console.error("createBuild error:", err);
    res.status(500).json({ error: "Erreur création build" });
  }
};

exports.updateBuild = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { nom, description, version, statut, proprietaire } = req.body;
    const updated = await prisma.builds.update({
      where: { id },
      data: { nom, description, version, statut, proprietaire },
    });
    res.json(updated);
  } catch (err) {
    console.error("updateBuild error:", err);
    res.status(500).json({ error: "Erreur mise à jour build" });
  }
};

exports.deleteBuild = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.asset.deleteMany({ where: { buildId: id } });
    await prisma.builds.delete({ where: { id } });
    res.json({ message: "Build supprimé avec succès" });
  } catch (err) {
    console.error("deleteBuild error:", err);
    res.status(500).json({ error: "Erreur suppression build" });
  }
};

// === AJOUT NOUVEAUTÉ : addVersion + upload ==================
exports.addVersion = [
  upload.single("file"),
  async (req, res) => {
    try {
      const id = Number(req.params.id);
      const { version } = req.body;
      const file = req.file;

      if (!version) return res.status(400).json({ error: "Version manquante" });
      if (!file) return res.status(400).json({ error: "Fichier manquant" });

      const build = await prisma.builds.findUnique({ where: { id } });
      if (!build) return res.status(404).json({ error: "Build non trouvé" });

      // Met à jour la version
      const updated = await prisma.builds.update({
        where: { id },
        data: { version, updatedAt: new Date() },
      });

      // Ajoute le fichier
      const asset = await prisma.asset.create({
        data: {
          filename: file.filename,
          original: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          path: `/uploads/${file.filename}`,
          buildId: id,
        },
      });

      res.json({
        success: true,
        message: "Version et fichier ajoutés",
        build: updated,
        asset,
      });
    } catch (err) {
      console.error("addVersion error:", err);
      res.status(500).json({ error: "Erreur lors de l'ajout de la version" });
    }
  },
];
