const path = require("path");
const fs = require("fs");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const UPLOAD_DIR = path.join(__dirname, "..", "..", "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const EXT_TO_MIME = {
  ".txt": "text/plain",
  ".md": "text/markdown",
  ".json": "application/json",
  ".js": "application/javascript",
  ".jsx": "text/javascript",
  ".ts": "application/typescript",
  ".tsx": "application/typescript",
  ".html": "text/html",
  ".css": "text/css",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".pdf": "application/pdf",
  ".zip": "application/zip",
  ".rar": "application/vnd.rar",
  ".7z": "application/x-7z-compressed",
  ".mp3": "audio/mpeg",
  ".wav": "audio/wav",
  ".mp4": "video/mp4",
  ".mov": "video/quicktime",
  ".xls": "application/vnd.ms-excel",
  ".xlsx": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  ".doc": "application/msword",
  ".docx":
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".ppt": "application/vnd.ms-powerpoint",
  ".pptx":
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};

const EXT_TO_LABEL = {
  ".txt": "Fichier texte",
  ".md": "Fichier markdown",
  ".json": "Fichier JSON",
  ".js": "Fichier JavaScript",
  ".ts": "Fichier TypeScript",
  ".html": "Fichier HTML",
  ".css": "Fichier CSS",
  ".png": "Image PNG",
  ".jpg": "Image JPG",
  ".jpeg": "Image JPEG",
  ".gif": "Image GIF",
  ".svg": "Image SVG",
  ".pdf": "Fichier PDF",
  ".zip": "Archive ZIP",
  ".tsx": "Fichier TypeScript avec JSX",
};

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

exports.uploadFiles = async (req, res) => {
  try {
    const buildId = Number(req.params.buildId) || Number(req.params.id);
    const version = req.body.version || null;
    const description = req.body.description || null;

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier envoyé" });
    }

    const f = req.file;

    const ext = path.extname(f.originalname || "").toLowerCase();

    const detectedMime =
      EXT_TO_MIME[ext] || f.mimetype || "application/octet-stream";

    const asset = await prisma.asset.create({
      data: {
        filename: f.filename,
        original: f.originalname,
        mimetype: detectedMime,
        size: f.size,
        path: f.path,
        buildId,
        version,
        description,
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

    const assetsWithLabel = assets.map((a) => {
      const ext = path.extname(a.original || "").toLowerCase();
      return {
        ...a,
        displayType: EXT_TO_LABEL[ext] || ext || "Type inconnu",
      };
    });

    res.json(assetsWithLabel);
  } catch (err) {
    console.error("getAssetsByBuild", err);
    res.status(500).json({ error: "Erreur chargement fichiers" });
  }
};

exports.getAssetById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        build: {
          select: {
            id: true,
            nom: true,
            version: true,
          },
        },
      },
    });

    if (!asset) {
      return res.status(404).json({ error: "Asset non trouvé" });
    }

    const ext = path.extname(asset.original || "").toLowerCase();
    const assetWithLabel = {
      ...asset,
      displayType: EXT_TO_LABEL[ext] || ext || "Type inconnu",
    };

    res.json(assetWithLabel);
  } catch (err) {
    console.error("getAssetById error:", err);
    res.status(500).json({ error: "Erreur récupération asset" });
  }
};

exports.downloadAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: "Fichier non trouvé" });

    const filePath = path.isAbsolute(asset.path)
      ? asset.path
      : path.join(__dirname, "..", "..", asset.path);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: "Fichier manquant sur le serveur" });
    }

    const ext = path.extname(asset.original || "").toLowerCase();
    const contentType =
      asset.mimetype || EXT_TO_MIME[ext] || "application/octet-stream";
    res.setHeader("Content-Type", contentType);

    res.download(filePath, asset.original);
  } catch (err) {
    console.error("downloadAsset", err);
    res.status(500).json({ error: "Erreur téléchargement" });
  }
};

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
