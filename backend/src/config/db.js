const { PrismaClient } = require("../generated/prisma"); // Chemin correct
const prisma = new PrismaClient();

module.exports = prisma;
