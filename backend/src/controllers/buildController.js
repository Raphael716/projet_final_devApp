const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// GET /api/builds
exports.getBuilds = async (req, res) => {
  try {
    const builds = await prisma.builds.findMany({
      orderBy: { updatedAt: "desc" },
    });
    res.json(builds);
  } catch (err) {
    console.error("getBuilds error:", err);
    res.status(500).json({ error: "Impossible de récupérer les builds" });
  }
};

// POST /api/builds
exports.createBuild = async (req, res) => {
  try {
    const {
      nom,
      description,
      descriptionComplete,
      version,
      statut,
      proprietaire,
    } = req.body;
    const build = await prisma.builds.create({
      data: {
        nom,
        description,
        descriptionComplete,
        version,
        statut,
        proprietaire,
      },
    });
    res.json(build);
  } catch (err) {
    console.error("createBuild error:", err);
    res.status(500).json({ error: "Impossible de créer le build" });
  }
};

// GET /api/builds/:id
exports.getBuildById = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const build = await prisma.builds.findUnique({ where: { id } });
    if (!build) return res.status(404).json({ error: "Build non trouvé" });
    res.json(build);
  } catch (err) {
    console.error("getBuildById error:", err);
    res.status(500).json({ error: "Impossible de récupérer le build" });
  }
};

// PUT /api/builds/:id
exports.updateBuild = async (req, res) => {
  try {
    const id = Number(req.params.id);
    const build = await prisma.builds.update({
      where: { id },
      data: req.body,
    });
    res.json(build);
  } catch (err) {
    console.error("updateBuild error:", err);
    res.status(500).json({ error: "Impossible de mettre à jour le build" });
  }
};

// DELETE /api/builds/:id
exports.deleteBuild = async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.builds.delete({ where: { id } });
    res.json({ success: true });
  } catch (err) {
    console.error("deleteBuild error:", err);
    res.status(500).json({ error: "Impossible de supprimer le build" });
  }
};
