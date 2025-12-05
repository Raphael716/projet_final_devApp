import { defineConfig } from "vitest/config";
import { loadEnv } from "vite";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.integration.test.js"],
    testTimeout: 15000,
    env: loadEnv("test", process.cwd(), ""),
    reporters: ["verbose"],
  },
});
