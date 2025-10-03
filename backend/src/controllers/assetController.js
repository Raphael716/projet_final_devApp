const path = require('path');
const fs = require('fs');
const multer = require('multer');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Ensure uploads dir exists
const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${unique}${ext}`);
  },
});

const upload = multer({ storage });

exports.uploadMiddleware = upload.array('files');

// POST /api/assets/upload/:buildId
exports.uploadFiles = async (req, res) => {
  try {
    const buildId = Number(req.params.buildId);
    if (!req.files || !req.files.length) return res.status(400).json({ error: 'Aucun fichier' });

    const created = [];
    for (const f of req.files) {
      const a = await prisma.asset.create({
        data: {
          filename: f.filename,
          original: f.originalname,
          mimetype: f.mimetype,
          size: f.size,
          path: f.path,
          buildId,
        },
      });
      created.push(a);
    }
    res.json({ success: true, assets: created });
  } catch (err) {
    console.error('uploadFiles error:', err);
    res.status(500).json({ error: 'Erreur upload fichiers' });
  }
};

// GET /api/assets/build/:buildId
exports.getAssetsForBuild = async (req, res) => {
  try {
    const buildId = Number(req.params.buildId);
    const assets = await prisma.asset.findMany({ where: { buildId } });
    res.json(assets);
  } catch (err) {
    console.error('getAssetsForBuild error:', err);
    res.status(500).json({ error: 'Erreur récupération assets' });
  }
};

// GET /api/assets/download/:id
exports.downloadAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: 'Fichier not found' });
    const p = asset.path;
    res.download(p, asset.original);
  } catch (err) {
    console.error('downloadAsset error:', err);
    res.status(500).json({ error: 'Erreur téléchargement' });
  }
};

// DELETE /api/assets/:id
exports.deleteAsset = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const asset = await prisma.asset.findUnique({ where: { id } });
    if (!asset) return res.status(404).json({ error: 'Fichier not found' });

    // remove file from disk
    if (asset.path && fs.existsSync(asset.path)) {
      try {
        fs.unlinkSync(asset.path);
      } catch (e) {
        console.error('Error deleting file from disk:', e);
      }
    }

    await prisma.asset.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error('deleteAsset error:', err);
    res.status(500).json({ error: 'Erreur suppression asset' });
  }
};
