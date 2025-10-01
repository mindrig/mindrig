import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "happy-dom",
    globals: true,
    setupFiles: [import.meta.dirname + "/tests/unit/setup.ts"],
    include: ["src/__tests__/**/*.test.ts", "src/__tests__/**/*.test.tsx"],

    // Display paths in the context of the monorepo
    root: import.meta.dirname + "/../..",
    dir: import.meta.dirname,
    // Ignore packages without tests
    passWithNoTests: true,
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
      streamdown: path.resolve(
        import.meta.dirname,
        "tests/unit/mocks/streamdown.tsx",
      ),
    },
  },
});
