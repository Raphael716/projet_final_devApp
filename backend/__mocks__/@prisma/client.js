import { vi } from "vitest";

// Create the global mock object
global.prismaMock = {
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

// Mock the PrismaClient constructor
export const PrismaClient = vi.fn(() => global.prismaMock);
