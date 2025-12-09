import { AssetResolver } from "@/aspects/asset/types";
import { ClientState } from "@wrkspc/core/client";
import { bodyCn } from "@wrkspc/theme";

export namespace WebviewHtml {
  export interface Props {
    devServer?: boolean;
    uris: Uris;
    /** Initial state. */
    initialState?: ClientState;
  }

  export interface Uris {
    csp?: string;
    app: string;
    styles?: string;
    reactRefresh?: string;
    viteClient?: string;
    /** Assets resolve function. */
    asset?: AssetResolver | undefined;
  }
}

export function webviewHtml(props: WebviewHtml.Props): string {
  const { uris, devServer } = props;

  const headInjects = [];

  if (uris.asset) headInjects.push(assetResolver(uris.asset));

  if (uris.csp)
    headInjects.push(
      `<meta http-equiv="Content-Security-Policy" content="${uris.csp}">`,
    );

  if (props.initialState)
    headInjects.push(`<script>
    globalThis.initialState = ${JSON.stringify(props.initialState)};
  </script>`);

  if (uris.reactRefresh)
    headInjects.push(`<script type="module">
  import RefreshRuntime from "${uris.reactRefresh}";
  RefreshRuntime.injectIntoGlobalHook(window);
  window.$RefreshReg$ = () => {};
  window.$RefreshSig$ = () => (type) => type;
  window.__vite_plugin_react_preamble_installed__ = true;
</script>`);

  if (uris.viteClient)
    headInjects.push(
      `<script type="module" src="${uris.viteClient}"></script>`,
    );

  if (uris.styles)
    headInjects.push(`<link href="${uris.styles}" rel="stylesheet" />`);

  const bodyInjects = [`<script type="module" src="${uris.app}"></script>`];

  return `<!doctype html>
<html lang="en" class="h-full">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${renderInjects(headInjects)}
    <title>Mind Rig</title>
  </head>
  <body class="${bodyCn()} h-full">
    <div id="root" class="h-full"></div>
${renderInjects(bodyInjects)}
  </body>
</html>`;
}

function assetResolver(asset: AssetResolver): string {
  switch (asset?.type) {
    case "manifest":
      return `<script>
  const assets = ${JSON.stringify(asset.manifest)};
  globalThis.__asset__ = function asset(path) {
    return assets[path] || path;
  };
</script>`;

    case "base":
      return `<script>
  const base = ${JSON.stringify(asset.base)};
  globalThis.__asset__ = function asset(path) {
    return base + path;
  };
</script>`;
  }
}

function renderInjects(injects: string[]) {
  return injects.map(indent).join("\n");
}

function indent(str: string) {
  const levelStr = "  ".repeat(2);
  return str
    .split("\n")
    .map((line) => `${levelStr}${line}`)
    .join("\n");
}
