import { resolve } from "path";
import { defineConfig } from "vite";

export default defineConfig(({ mode }) => ({
  build: {
    lib: {
      entry: resolve(__dirname, "src/extension.ts"),
      formats: ["cjs"],
      fileName: "extension",
    },
    rollupOptions: {
      external: [
        "vscode",
        "@mindrig/parser-wasm",
        "yjs",
        "ai",
        "@ai-sdk/gateway",
        "mime",
        "alwaysly",
      ],
    },
    outDir: "dist/extension",
    target: "node16",
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
