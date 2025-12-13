import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    coverage: ({
      provider: "v8",
      reporter: ["text", "lcov", "html", "clover"],
      reportsDirectory: "coverage/SPL",
      exclude: ["**/*.integration.test.js", "**/*.css", "node_modules/**", "dist/**"],
      lines: 75,
      branches: 75,
      functions: 75,
      statements: 75,
    } as any),
  },
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:4000",
        changeOrigin: true,
        secure: false,
        ws: true,
        xfwd: true,
        rewrite: (path: string) => path,
        timeout: 120000,
        proxyTimeout: 120000,
      },
    },
  },
});
