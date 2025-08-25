export interface WorkbenchWebviewHtmlUris {
  csp?: string;
  app: string;
  styles?: string;
  reactRefresh?: string;
  viteClient?: string;
}

export interface WorkbenchWebviewHtmlProps {
  useDevServer: boolean;
  uris: WorkbenchWebviewHtmlUris;
}

export function workbenchWebviewHtml(props: WorkbenchWebviewHtmlProps): string {
  const { uris, useDevServer } = props;

  const headInjects = [];

  if (uris.csp)
    headInjects.push(
      `<meta http-equiv="Content-Security-Policy" content="${uris.csp}">`,
    );

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
    headInjects.push(`<link href="${uris.styles}" rel="stylesheet">`);

  const bodyInjects = [
    `<script ${useDevServer ? 'type="module"' : ""} src="${uris.app}"></script>`,
  ];

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
${renderInjects(headInjects)}
  <title>Mind Control Code</title>
</head>
<body class="bg-gray-100">
  <div id="root" class="min-h-screen"></div>
${renderInjects(bodyInjects)}
</body>
</html>`;
}

function renderInjects(injects: string[]) {
  return injects.map(indent).join("\n");
}

function indent(str: string) {
  const levelStr = "  ";
  return str
    .split("\n")
    .map((line) => `${levelStr}${line}`)
    .join("\n");
}
