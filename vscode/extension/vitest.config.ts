import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
    globals: true,
    setupFiles: [],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // Mock VS Code API for unit tests
      vscode: path.resolve(__dirname, "__mocks__/vscode.ts"),
    },
  },
});
