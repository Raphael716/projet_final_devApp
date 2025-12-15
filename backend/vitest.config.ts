import { defineConfig } from "vitest/config";
import dotenv from "dotenv";
import path from "path";

// Charger .env.test pour les tests d'intégration, .env sinon
const envFile = process.env.npm_lifecycle_event?.includes("integration")
  ? ".env.test"
  : ".env";

try {
  dotenv.config({ path: path.resolve(__dirname, envFile), override: true });
} catch (e) {
  console.warn(`Could not load ${envFile}`);
}

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "src/**/*.test.js",
      "src/**/*.spec.js",
      "src/**/*.integration.test.js",
    ],
    exclude: ["node_modules", "dist"],
    cache: false,
    testTimeout: 15000,
    hookTimeout: 15000,
    server: {
      deps: {
        inline: ["@prisma/client"],
      },
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html", "clover"],
      reportsDirectory: "coverage/backend",
      exclude: ["**/*.integration.test.js", "**/*.css", "node_modules/**", "dist/**"],
      all: true,
      lines: 75,
      branches: 75,
      functions: 75,
      statements: 75,
    },
  },
});
