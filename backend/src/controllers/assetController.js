import path from "path";
import fs from "fs";
import multer from "multer";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";

const prisma = new PrismaClient();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    // Vérifier et créer le dossier si nécessaire
    if (!fs.existsSync(UPLOAD_DIR)) {
      try {
        fs.mkdirSync(UPLOAD_DIR, { recursive: true });
      } catch (err) {
        return cb(
          new Error(`Impossible de créer le dossier d'upload: ${err.message}`)
        );
      }
    }

    // Vérifier les permissions d'écriture
    try {
      fs.accessSync(UPLOAD_DIR, fs.constants.W_OK);
    } catch (err) {
      return cb(
        new Error(
          `Pas de permission d'écriture dans le dossier d'upload: ${err.message}`
        )
      );
    }

    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    try {
      const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.originalname || "").toLowerCase();
      if (!ext) {
        return cb(new Error("Le fichier doit avoir une extension"));
      }
      const filename = `${unique}${ext}`;
      cb(null, filename);
    } catch (err) {
      cb(
        new Error(
          `Erreur lors de la génération du nom de fichier: ${err.message}`
        )
      );
    }
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB max
    files: 1,
  },
  fileFilter: (req, file, cb) => {
    // Vérifier que le fichier a une extension
    const ext = path.extname(file.originalname || "").toLowerCase();
    if (!ext) {
      return cb(new Error("Le fichier doit avoir une extension"));
    }
    cb(null, true);
  },
});

export const uploadMiddleware = (req, res, next) => {
  upload.single("file")(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res
          .status(400)
          .json({ error: "Le fichier est trop volumineux (max 50MB)" });
      }
      return res.status(400).json({ error: `Erreur upload: ${err.message}` });
    } else if (err) {
      return res
        .status(500)
        .json({ error: `Erreur inattendue: ${err.message}` });
    }
    next();
  });
};

export const uploadFiles = async (req, res) => {
  try {
    const buildId = Number(req.params.buildId) || Number(req.params.id);
    if (!buildId || isNaN(buildId)) {
      return res.status(400).json({ error: "ID du build invalide" });
    }

    // Vérifier si le build existe
    const buildExists = await prisma.builds.findUnique({
      where: { id: buildId },
    });
    if (!buildExists) {
      return res.status(404).json({ error: "Build non trouvé" });
    }

    const version = req.body.version;
    const description = req.body.description;

    // Validation des champs requis
    if (!version) {
      return res.status(400).json({ error: "Le numéro de version est requis" });
    }

    if (!req.file) {
      return res.status(400).json({ error: "Aucun fichier envoyé" });
    }

    const f = req.file;

    // Vérifier que le dossier uploads existe
    if (!fs.existsSync(UPLOAD_DIR)) {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    }

    const ext = path.extname(f.originalname || "").toLowerCase();
    const detectedMime =
      EXT_TO_MIME[ext] || f.mimetype || "application/octet-stream";

    // Créer l'asset dans la base de données
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

    // Mettre à jour la version du build
    await prisma.builds.update({
      where: { id: buildId },
      data: { version },
    });

    res.json({
      success: true,
      asset,
      message: "Version ajoutée avec succès",
    });
  } catch (err) {
    // Nettoyer le fichier uploadé en cas d'erreur
    if (req.file && req.file.path) {
      try {
        fs.unlinkSync(req.file.path);
      } catch (_unlinkErr) {
        // Ignore les erreurs de nettoyage
      }
    }

    res.status(500).json({
      error: "Erreur lors de l'upload du fichier",
      details: err.message,
    });
  }
};

export const getAssetsByBuild = async (req, res) => {
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
    console.error("getAssetsByBuild error:", err);
    res.status(500).json({ error: "Erreur chargement fichiers", details: err.message });
  }
};

export const getAssetById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        builds: {
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
    res.status(500).json({ error: "Erreur récupération asset", details: err.message });
  }
};

export const downloadAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: "Fichier non trouvé" });

    let filePath = asset.path;
    const possiblePaths = [
      asset.path,
      path.join(__dirname, "..", "..", asset.path),
      path.join(__dirname, "..", "..", "uploads", asset.filename),
      path.join(UPLOAD_DIR, asset.filename),
    ];

    filePath = possiblePaths.find((p) => fs.existsSync(p));

    if (!filePath) {
      return res.status(404).json({ error: "Fichier manquant sur le serveur" });
    }

    try {
      await fs.promises.access(filePath, fs.constants.R_OK);
    } catch (err) {
      return res.status(403).json({ error: "Accès au fichier impossible" });
    }

    const ext = path.extname(asset.original || "").toLowerCase();
    const contentType =
      asset.mimetype || EXT_TO_MIME[ext] || "application/octet-stream";

    res.setHeader("Content-Type", contentType);
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(asset.original)}"`
    );

    // Utiliser un stream pour envoyer le fichier
    const fileStream = fs.createReadStream(filePath);
    fileStream.on("error", (error) => {
      if (!res.headersSent) {
        res.status(500).json({ error: "Erreur lors de la lecture du fichier" });
      }
    });

    fileStream.pipe(res);
  } catch (err) {
    console.error("downloadAsset error:", err);
    res.status(500).json({ error: "Erreur téléchargement", details: err.message });
  }
};

export const deleteAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: "Fichier non trouvé" });

    if (asset.path && fs.existsSync(asset.path)) {
      try {
        fs.unlinkSync(asset.path);
      } catch (_e) {}
    }

    await prisma.asset.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("deleteAsset error:", err);
    res.status(500).json({ error: "Erreur suppression asset", details: err.message });
  }
};
