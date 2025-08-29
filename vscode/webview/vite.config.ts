import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig, Plugin } from "vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss() as any as Plugin[]],
  server: {
    port: 5173,
    // NOTE: When developing inside a dev container, the default `localhost`
    // prevents the host to access the dev server.
    host: "127.0.0.1",
    hmr: {
      port: 5173,
      host: "127.0.0.1",
    },
    cors: {
      origin: [
        // Browser
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        // VS Code Webviews
        /^vscode-webview:\/\//,
      ],
      credentials: true,
    },
    allowedHosts: ["127.0.0.1", "localhost"],
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
