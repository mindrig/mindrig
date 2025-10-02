import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: ["src/**/*.test.ts?(x)", "src/**/test.ts?(x)"],

    // Display paths in the context of the monorepo
    root: import.meta.dirname + "/../..",
    dir: import.meta.dirname,
    // Ignore packages without tests
    passWithNoTests: true,
  },
});
