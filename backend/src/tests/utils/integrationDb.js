import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Ensure the database exists with required tables for integration tests.
 * Works for both MySQL and SQLite based on `DATABASE_URL`.
 */
export async function ensureTestDatabase() {
  const url = process.env.DATABASE_URL || "";
  const isSqlite = url.startsWith("file:") || url.includes("sqlite");

  await prisma.$connect();

  if (isSqlite) {
    // Create tables if they don't exist (idempotent for SQLite)
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "User" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "username" TEXT NOT NULL,
        "email" TEXT NOT NULL,
        "password" TEXT NOT NULL,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "admin" INTEGER NOT NULL DEFAULT 0
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE UNIQUE INDEX IF NOT EXISTS "email" ON "User"("email");
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Builds" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "nom" TEXT NOT NULL,
        "description" TEXT,
        "version" TEXT,
        "statut" TEXT,
        "proprietaire" TEXT,
        "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "Asset" (
        "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
        "filename" TEXT NOT NULL,
        "original" TEXT NOT NULL,
        "mimetype" TEXT NOT NULL,
        "size" INTEGER NOT NULL,
        "path" TEXT NOT NULL,
        "buildId" INTEGER NOT NULL,
        "version" TEXT,
        "description" TEXT,
        "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "Asset_buildId_fkey" FOREIGN KEY ("buildId") REFERENCES "Builds" ("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
  } else {
    // MySQL: create tables if they don't exist (idempotent). Use backticks for identifiers.
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`User\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`username\` VARCHAR(255) NOT NULL,
        \`email\` VARCHAR(255) NOT NULL,
        \`password\` VARCHAR(255) NOT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`admin\` TINYINT NOT NULL DEFAULT 0,
        PRIMARY KEY (\`id\`),
        UNIQUE KEY \`email\` (\`email\`)
      ) ENGINE=InnoDB;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`Builds\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`nom\` VARCHAR(255) NOT NULL,
        \`description\` TEXT NULL,
        \`version\` VARCHAR(50) NULL,
        \`statut\` VARCHAR(50) NULL,
        \`proprietaire\` VARCHAR(255) NULL,
        \`updatedAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`)
      ) ENGINE=InnoDB;
    `);

    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS \`Asset\` (
        \`id\` INT NOT NULL AUTO_INCREMENT,
        \`filename\` VARCHAR(255) NOT NULL,
        \`original\` VARCHAR(255) NOT NULL,
        \`mimetype\` VARCHAR(100) NOT NULL,
        \`size\` INT NOT NULL,
        \`path\` VARCHAR(255) NOT NULL,
        \`buildId\` INT NOT NULL,
        \`version\` VARCHAR(50) NULL,
        \`description\` TEXT NULL,
        \`createdAt\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`id\`),
        KEY \`buildId\` (\`buildId\`),
        CONSTRAINT \`Asset_buildId_fkey\` FOREIGN KEY (\`buildId\`) REFERENCES \`Builds\` (\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB;
    `);
  }
}
