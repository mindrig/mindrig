import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    host: "localhost",
    hmr: {
      port: 5173,
      host: "localhost",
    },
  },
  build: {
    rollupOptions: {
      input: resolve(__dirname, "src/index.tsx"),
      output: {
        entryFileNames: "webview.js",
        assetFileNames: "index.[ext]",
        format: "es",
      },
    },
    outDir: "../extension/dist/webview",
    emptyOutDir: true,
    target: "es2020",
    sourcemap: true,
    minify: mode === "production",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
}));
