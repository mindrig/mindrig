import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  files: "./out/test/*.test.js",
  workspaceFolder: "./demo",
  launchArgs: ["--disable-gpu", "--disable-extensions"],
});
