import * as vscode from "vscode";
import { workbenchWebviewHtml, WorkbenchWebviewHtmlUris } from "./html";
import { resolveDevServerUri } from "../devServer";

export class WorkbenchViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "mindcontrol.workbench";

  #extensionUri: vscode.Uri;
  #isDevelopment: boolean;

  constructor(
    readonly extensionUri: vscode.Uri,
    // NOTE: It is unused at the moment, but keep it for future use
    isDevelopment: boolean,
  ) {
    this.#extensionUri = extensionUri;
    this.#isDevelopment = isDevelopment;
  }

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.#extensionUri],
    };

    this.#applyHtml(webviewView.webview);
  }

  async #applyHtml(webview: vscode.Webview) {
    const html = await this.#renderHtml(webview);
    webview.html = html;
  }

  async #renderHtml(webview: vscode.Webview): Promise<string> {
    const useDevServer = process.env.VSCODE_DEV_SERVER === "true";

    const uris = useDevServer
      ? await this.#devServerUris()
      : this.#localPaths(webview);

    return workbenchWebviewHtml({ useDevServer, uris });
  }

  async #devServerUris(): Promise<WorkbenchWebviewHtmlUris> {
    const externalUri = await resolveDevServerUri();
    const baseUri = externalUri.toString().replace(/\/$/, "");

    const csp = [
      "`default-src 'none';",
      `img-src ${webviewSources} https: data:;`,
      `script-src ${webviewSources} ${baseUri} 'unsafe-eval' 'unsafe-inline';`,
      `script-src-elem ${webviewSources} ${baseUri} 'unsafe-eval' 'unsafe-inline';`,
      `style-src ${webviewSources} ${baseUri} 'unsafe-inline';`,
      `connect-src ${baseUri} ws://127.0.0.1:* ws://localhost:*;`,
    ].join(" ");

    const app = `${baseUri}/src/index.tsx`;
    const reactRefresh = `${baseUri}/@react-refresh`;
    const viteClient = `${baseUri}/@vite/client`;

    return { csp, app, reactRefresh, viteClient };
  }

  #localPaths(webview: vscode.Webview): WorkbenchWebviewHtmlUris {
    const csp = [
      "default-src 'none';",
      `img-src ${webviewSources} https: data:;`,
      `script-src ${webviewSources} 'unsafe-inline';`,
      `style-src ${webviewSources} 'unsafe-inline';`,
    ].join(" ");

    const baseUri = [this.#extensionUri, "dist", "webview"] as const;
    const app = webview
      .asWebviewUri(vscode.Uri.joinPath(...baseUri, "webview.js"))
      .toString();
    const styles = webview
      .asWebviewUri(vscode.Uri.joinPath(...baseUri, "index.css"))
      .toString();

    return { csp, app, styles };
  }
}

const webviewSources =
  "vscode-webview: vscode-resource: https://*.vscode-cdn.net";
