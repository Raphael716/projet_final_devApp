import { defineConfig } from "cypress";
import codeCoverage from "@cypress/code-coverage/task";

const { defineConfig } = require("cypress");

module.exports = defineConfig({
  projectId: '2dfztd',
  e2e: {
    baseUrl: "http://localhost:5173",
    viewportWidth: 1280,
    viewportHeight: 720,
    video: false,
    setupNodeEvents(on, config) {
      codeCoverage(on, config);
      return config;
    },
  },
});
