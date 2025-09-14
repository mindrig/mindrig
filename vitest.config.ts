import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    projects: [
      "vscode/extension",
      "vscode/webview",
      "vscode/types",
      "vscode/sync",
      "pkgs/*",
      "subs/*/pkgs/*",
    ],
  },
});
