import { resolve } from "path";
import { log } from "smollog";
import { defineConfig } from "vite";
import { WebSocketServer } from "ws";

log.level = "debug";

const autoReloadEnv = process.env.MINDRIG_DEV_AUTO_RELOAD;
const autoReloadEnabled = autoReloadEnv === "true";

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
        "fastest-levenshtein",
        "nanoid",
        "smollog",
        "ws",
      ],
    },
    outDir: "dist/extension",
    target: "node16",
    sourcemap: true,
    minify: mode === "production",
  },
  define: {
    "process.env.NODE_ENV": JSON.stringify(mode),
    "process.env.MINDRIG_DEV_AUTO_RELOAD": JSON.stringify(autoReloadEnv || ""),
  },
  resolve: {
    alias: {
      "@": resolve(__dirname, "./src"),
    },
  },
  plugins: [autoReloadEnabled && autoReloadPlugin()],
}));

const AUTO_RELOAD_HOST = "0.0.0.0";
const AUTO_RELOAD_PORT = 3192;

let autoReloadWss: WebSocketServer | null = null;

function autoReloadPlugin() {
  return {
    name: "auto-reload",

    buildStart() {
      if (autoReloadWss) return;

      autoReloadWss = new WebSocketServer({
        host: AUTO_RELOAD_HOST,
        port: AUTO_RELOAD_PORT,
      });

      log.debug(
        `Auto-reload enabled and running on ws://${AUTO_RELOAD_HOST}:${AUTO_RELOAD_PORT}`,
      );

      autoReloadWss.on("error", (error) =>
        log.warn("Auto-reload server error", error),
      );

      autoReloadWss.on("close", () => log.warn("Auto-reload server stopped"));
    },

    buildEnd() {
      if (!autoReloadWss) return;

      if (!autoReloadWss.clients.size)
        log.debug("No connected auto-reload clients found");

      autoReloadWss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN)
          client.send(JSON.stringify({ type: "reload" }));
      });

      log.debug("Extension reload triggered");
    },
  };
}
