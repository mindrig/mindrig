import { defineConfig } from "@vscode/test-cli";

export default defineConfig({
  version: "insiders",
  files: "./out/**/*.test.js",
  workspaceFolder: "./test/workspace",
  mocha: {
    timeout: 10_000,
  },
  launchArgs: [
    "--disable-gpu",
    "--disable-extensions",
    "--remote-debugging-port=9222",
    "--inspect-extensions=9229",
  ],
});
