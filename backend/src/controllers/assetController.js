const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// --- Configuration de stockage ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage });
exports.uploadMiddleware = upload.single("file");

// --- Upload d’un fichier pour une version ---
exports.uploadFiles = async (req, res) => {
  try {
    const buildId = Number(req.params.buildId) || Number(req.params.id);
    const version = req.body.version || null;

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier envoyé" });
    }

    const f = req.file;

    const asset = await prisma.asset.create({
      data: {
        filename: f.filename,
        original: f.originalname,
        mimetype: f.mimetype,
        size: f.size,
        path: f.path,
        buildId,
        version,
      },
    });

    if (version) {
      await prisma.builds.update({
        where: { id: buildId },
        data: { version },
      });
    }

    res.json({ success: true, asset });
  } catch (err) {
    console.error("uploadFiles error:", err);
    res.status(500).json({ error: "Erreur upload fichier" });
  }
};

// --- Récupération des fichiers d’un build ---
exports.getAssetsByBuild = async (req, res) => {
  try {
    const buildId = Number(req.params.id);
    const assets = await prisma.asset.findMany({
      where: { buildId },
      select: {
        id: true,
        filename: true,
        original: true,
        mimetype: true,
        size: true,
        path: true,
        buildId: true,
        version: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });
    res.json(assets);
  } catch (err) {
    console.error("getAssetsByBuild", err);
    res.status(500).json({ error: "Erreur chargement fichiers" });
  }
};

// --- Téléchargement d’un fichier ---
exports.downloadAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: "Fichier non trouvé" });

    const filePath = path.join(__dirname, "..", "..", asset.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Fichier manquant sur le serveur" });
    }

    res.download(filePath, asset.original);
  } catch (err) {
    console.error("downloadAsset", err);
    res.status(500).json({ error: "Erreur téléchargement" });
  }
};

// --- Suppression d’un fichier ---
exports.deleteAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: "Fichier non trouvé" });

    if (asset.path && fs.existsSync(asset.path)) {
      try {
        fs.unlinkSync(asset.path);
      } catch (e) {
        console.error("Erreur suppression fichier disque:", e);
      }
    }

    await prisma.asset.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("deleteAsset error:", err);
    res.status(500).json({ error: "Erreur suppression asset" });
  }
};
