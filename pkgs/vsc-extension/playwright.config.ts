import { defineConfig } from "@playwright/test";

export default defineConfig({
  testMatch: "**/*.spec.ts",
  reporter: "list",
  timeout: 10_000,
  workers: 1,
  expect: { timeout: 3_000 },
  outputDir: "./tests/results",
});
