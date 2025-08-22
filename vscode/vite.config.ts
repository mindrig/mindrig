import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

const isWebview = process.env.BUILD_TARGET === "webview";

export default defineConfig({
  plugins: [react()],
  build: isWebview
    ? {
        // Webview
        rollupOptions: {
          input: resolve(__dirname, "src/webview/index.tsx"),
          output: {
            entryFileNames: "webview.js",
            assetFileNames: "index.[ext]",
            format: "es",
          },
        },
        outDir: "dist/webview",
        target: "es2020",
        sourcemap: true,
        minify: false,
      }
    : {
        // Extension
        lib: {
          entry: resolve(__dirname, "src/extension.ts"),
          formats: ["cjs"],
          fileName: "extension",
        },
        rollupOptions: {
          external: ["vscode"],
        },
        outDir: "dist/extension",
        target: "node16",
        sourcemap: true,
        minify: false,
      },
  define: {
    "process.env.NODE_ENV": JSON.stringify(
      process.env.NODE_ENV || "development",
    ),
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
});
