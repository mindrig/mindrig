import { describe, expect, it } from "vitest";
import { workbenchWebviewHtml } from "./html.js";

describe(workbenchWebviewHtml, () => {
  it("renders minimal HTML", () => {
    expect(workbenchWebviewHtml({ uris: { app: "/app.js" } }))
      .toMatchInlineSnapshot(`
        "<!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <title>Mind Control Code</title>
          </head>
          <body class="bg-gray-100">
            <div id="root" class="min-h-screen"></div>
            <script src="/app.js"></script>
          </body>
        </html>"
      `);
  });

  it("renders full HTML", () => {
    expect(
      workbenchWebviewHtml({
        uris: {
          csp: "script-src 'none';",
          app: "/app.js",
          styles: "/styles.css",
          reactRefresh: "/react-refresh.js",
          viteClient: "/vite-client.js",
        },
      }),
    ).toMatchInlineSnapshot(`
      "<!doctype html>
      <html lang="en">
        <head>
          <meta charset="UTF-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <meta http-equiv="Content-Security-Policy" content="script-src 'none';">
          <script type="module">
            import RefreshRuntime from "/react-refresh.js";
            RefreshRuntime.injectIntoGlobalHook(window);
            window.$RefreshReg$ = () => {};
            window.$RefreshSig$ = () => (type) => type;
            window.__vite_plugin_react_preamble_installed__ = true;
          </script>
          <script type="module" src="/vite-client.js"></script>
          <link href="/styles.css" rel="stylesheet" />
          <title>Mind Control Code</title>
        </head>
        <body class="bg-gray-100">
          <div id="root" class="min-h-screen"></div>
          <script src="/app.js"></script>
        </body>
      </html>"
    `);
  });

  describe("useDevServer", () => {
    it("renders minimal HTML with ESM scripts", () => {
      expect(
        workbenchWebviewHtml({ devServer: true, uris: { app: "/app.js" } }),
      ).toMatchInlineSnapshot(`
        "<!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0">

            <title>Mind Control Code</title>
          </head>
          <body class="bg-gray-100">
            <div id="root" class="min-h-screen"></div>
            <script type="module" src="/app.js"></script>
          </body>
        </html>"
      `);
    });

    it("renders full HTML with ESM scripts", () => {
      expect(
        workbenchWebviewHtml({
          devServer: true,
          uris: {
            csp: "script-src 'none';",
            app: "/app.js",
            styles: "/styles.css",
            reactRefresh: "/react-refresh.js",
            viteClient: "/vite-client.js",
          },
        }),
      ).toMatchInlineSnapshot(`
        "<!doctype html>
        <html lang="en">
          <head>
            <meta charset="UTF-8" />
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="Content-Security-Policy" content="script-src 'none';">
            <script type="module">
              import RefreshRuntime from "/react-refresh.js";
              RefreshRuntime.injectIntoGlobalHook(window);
              window.$RefreshReg$ = () => {};
              window.$RefreshSig$ = () => (type) => type;
              window.__vite_plugin_react_preamble_installed__ = true;
            </script>
            <script type="module" src="/vite-client.js"></script>
            <link href="/styles.css" rel="stylesheet" />
            <title>Mind Control Code</title>
          </head>
          <body class="bg-gray-100">
            <div id="root" class="min-h-screen"></div>
            <script type="module" src="/app.js"></script>
          </body>
        </html>"
      `);
    });
  });
});
