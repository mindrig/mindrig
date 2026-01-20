import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

// NOTE: When developing inside a dev container, the default `localhost`
// prevents the host to access the dev server.
// const host = "127.0.0.1";
const host = process.env.TAURI_DEV_HOST;
const port = 3194;
const hmrPort = 3195;
// const origin = `http://${host}:${port}`;

// https://vite.dev/config/
export default defineConfig(() => ({
  plugins: [react()],
  server: {
    port,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: hmrPort,
        }
      : undefined,
  },
  clearScreen: false, // Prevent Vite from obscuring rust errors
}));
