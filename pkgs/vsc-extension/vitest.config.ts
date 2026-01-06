import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts?(x)", "src/**/test.ts?(x)"],
    environment: "node",
    globals: true,
    setupFiles: [],

    // Restore mocks after each test
    restoreMocks: true,
    mockReset: true,

    // Display paths in the context of the monorepo
    root: import.meta.dirname + "/../..",
    dir: import.meta.dirname,
    // Ignore packages without tests
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Mock VS Code API for unit tests
      vscode: path.resolve(__dirname, "src/__tests__/mocks/vscode.ts"),
    },
  },
});
