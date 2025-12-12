import { vi } from "vitest";

// Mock Prisma Client globally before any imports
const prismaMock = {
  user: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    findFirst: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  builds: {
    findMany: vi.fn(),
    findUnique: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
  },
  version: {
    create: vi.fn(),
    findMany: vi.fn(),
  },
  $disconnect: vi.fn(),
};

// Mock @prisma/client before any test files load
vi.mock("@prisma/client", () => {
  return {
    PrismaClient: vi.fn(() => prismaMock),
  };
});

// Export mock for test files to use
global.prismaMock = prismaMock;
