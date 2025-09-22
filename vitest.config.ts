import { resolve } from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      resolve(import.meta.dirname, "pkgs/*"),
      resolve(import.meta.dirname, "subs/*/pkgs/*"),
    ],
  },
});
