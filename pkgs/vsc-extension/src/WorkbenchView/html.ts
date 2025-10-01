import { AssetResolver } from "@/aspects/asset";
import { bodyCn } from "@wrkspc/theme";
import { VscSettings } from "@wrkspc/vsc-settings";
import { VscState } from "@wrkspc/vsc-state";

export interface WorkbenchWebviewHtmlUris {
  csp?: string;
  app: string;
  styles?: string;
  reactRefresh?: string;
  viteClient?: string;
  /** Assets resolve function. */
  asset?: AssetResolver | undefined;
}

export interface WorkbenchWebviewHtmlProps {
  devServer?: boolean;
  uris: WorkbenchWebviewHtmlUris;
  /** Initial state. */
  initialState?: VscState;
}

export interface WorkbenchWebviewHtmlInitialState {
  settings?: VscSettings | undefined;
}

export type WorkbenchWebviewHtmlManifest = Record<string, string>;

export function workbenchWebviewHtml(props: WorkbenchWebviewHtmlProps): string {
  const { uris, devServer: useDevServer } = props;

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

  const bodyInjects = [
    `<script${useDevServer ? ' type="module"' : ""} src="${uris.app}"></script>`,
  ];

  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
${renderInjects(headInjects)}
    <title>MInd Rig</title>
  </head>
  <body class="${bodyCn()}">
    <div id="root"></div>
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
