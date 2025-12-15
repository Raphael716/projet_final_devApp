import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/**/*.integration.test.tsx"],
    testTimeout: 20000,
    reporters: ["verbose"],
    setupFiles: ["src/setupTests.ts"],
  },
  esbuild: {
    jsxInject: "import React from 'react'",
  },
});
