import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";
import { defineConfig, PluginOption } from "vite";

// NOTE: When developing inside a dev container, the default `localhost`
// prevents the host to access the dev server.
const host = "127.0.0.1";
const port = 5173;
const origin = `http://${host}:${port}`;

export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss(), , devAssetResolver(mode)],
    server: {
      port,
      host,
      hmr: { port, host },
      cors: {
        origin: [
          // Browser
          `http://localhost:${port}`,
          origin,
          // VS Code Webviews
          /^vscode-webview:\/\//,
        ],
        credentials: true,
      },
      allowedHosts: [host, "localhost"],
    },
    build: {
      manifest: true,
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
  };
});

function devAssetResolver(mode: string): PluginOption[] {
  const plugins: PluginOption[] = [];

  plugins.push({
    name: "asset-resolver-config",
    configResolved(config) {
      config.experimental.renderBuiltUrl = (path) => {
        const runtime = `__asset__(${JSON.stringify(path)})`;
        return { runtime };
      };
    },
  });

  if (mode === "development")
    plugins.push({
      name: "asset-resolver-dev",
      apply: "serve",
      enforce: "post",
      transform(code, id) {
        return code.replace(/\"\/@fs\//gm, `"${origin}/@fs\/`);
      },
    });

  return plugins;
}
