import { resolveDevServerUri } from "@/aspects/dev/server";
import { Manager } from "@/aspects/manager/Manager.js";
import { WebviewHtml, webviewHtml } from "@/aspects/webview/html";
import * as vscode from "vscode";
import { AssetResolver } from "../asset/types";
import { ClientStateManager } from "../client/StateManager";

export namespace WebviewHtmlManager {
  export interface Props {
    extensionUri: vscode.Uri;
    webview: vscode.Webview;
    state: ClientStateManager;
  }

  export type ViteManifest = Record<string, ViteManifestEntry>;

  export interface ViteManifestEntry {
    file: string;
    src?: string;
    isEntry?: boolean;
    css?: string[];
    assets?: string[];
  }
}

export class WebviewHtmlManager extends Manager {
  #extensionUri: vscode.Uri;
  #webview: vscode.Webview;
  #manifest: WebviewHtmlManager.ViteManifest | undefined | null;
  #state: ClientStateManager;

  constructor(parent: Manager, props: WebviewHtmlManager.Props) {
    super(parent);

    this.#extensionUri = props.extensionUri;
    this.#webview = props.webview;
    this.#state = props.state;

    this.#applyHtml(this.#webview);
  }

  async #applyHtml(webview: vscode.Webview) {
    const html = await this.#renderHtml(webview);
    webview.html = html;
  }

  async #renderHtml(webview: vscode.Webview): Promise<string> {
    const useDevServer = process.env.VSCODE_DEV_SERVER === "true";

    const [uris, initialState] = await Promise.all([
      useDevServer ? this.#devServerUris() : this.#localPaths(webview),
      this.#state.state,
    ]);

    return webviewHtml({
      devServer: useDevServer,
      uris,
      initialState,
    });
  }

  async #devServerUris(): Promise<WebviewHtml.Uris> {
    const externalUri = await resolveDevServerUri();
    const baseUri = externalUri.toString().replace(/\/$/, "");

    const baseCspUri = universalLocalUri(baseUri);
    // Vite websockets address for HMR
    const wsCspUri = universalLocalUri(`ws://${externalUri.authority}`);
    const csp = [
      "default-src 'none';",
      `img-src ${webviewSourceUris} ${baseCspUri} https: data:;`,
      `script-src ${webviewSourceUris} ${baseCspUri} 'unsafe-eval' 'unsafe-inline';`,
      `script-src-elem ${webviewSourceUris} ${baseCspUri} 'unsafe-eval' 'unsafe-inline';`,
      `style-src ${webviewSourceUris} ${baseCspUri} 'unsafe-inline';`,
      `font-src ${webviewSourceUris} ${baseCspUri} https: data:;`,
      // TODO: Come up with complete list of authorities rather than slapping global `https:`
      `connect-src ${baseUri} ${import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN} https: ${wsCspUri};`,
    ].join(" ");

    const app = `${baseUri}/src/index.tsx`;
    const reactRefresh = `${baseUri}/@react-refresh`;
    const viteClient = `${baseUri}/@vite/client`;

    return {
      csp,
      app,
      reactRefresh,
      viteClient,
    };
  }

  async #localPaths(webview: vscode.Webview): Promise<WebviewHtml.Uris> {
    const csp = [
      "default-src 'none';",
      `img-src ${webviewSourceUris} https: data:;`,
      `script-src ${webviewSourceUris} 'unsafe-inline';`,
      `style-src ${webviewSourceUris} 'unsafe-inline';`,
      `font-src ${webviewSourceUris} https: data:;`,
      `connect-src ${import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN} https:;`,
    ].join(" ");

    const baseUri = vscode.Uri.joinPath(this.#extensionUri, "dist", "webview");
    const app = webview
      .asWebviewUri(vscode.Uri.joinPath(baseUri, "webview.js"))
      .toString();
    const styles = webview
      .asWebviewUri(vscode.Uri.joinPath(baseUri, "index.css"))
      .toString();

    const manifest = await this.#loadManifest();
    const asset = manifest
      ? this.#createAssetResolver(webview, baseUri, manifest)
      : undefined;

    return { csp, app, styles, asset };
  }

  async #loadManifest(): Promise<WebviewHtmlManager.ViteManifest | null> {
    if (this.#manifest !== undefined) return this.#manifest;

    const manifestUri = vscode.Uri.joinPath(
      this.#extensionUri,
      "dist",
      "webview",
      ".vite",
      "manifest.json",
    );

    try {
      const manifestStr = await vscode.workspace.fs.readFile(manifestUri);
      this.#manifest = JSON.parse(new TextDecoder("utf-8").decode(manifestStr));
    } catch (error) {
      console.error("Failed to read webview manifest");
    }

    this.#manifest ||= null;
    return this.#manifest;
  }

  #createAssetResolver(
    webview: vscode.Webview,
    baseUri: vscode.Uri,
    manifest: WebviewHtmlManager.ViteManifest,
  ): AssetResolver | undefined {
    const map = new Map<string, string>();

    function add(path: string) {
      if (map.has(path)) return;

      const resolved = webview
        .asWebviewUri(vscode.Uri.joinPath(baseUri, path))
        .toString();
      map.set(path, resolved);
    }

    for (const entry of Object.values(manifest)) {
      add(entry.file);
      entry.css?.forEach(add);
      entry.assets?.forEach(add);
    }

    return { type: "manifest", manifest: Object.fromEntries(map) };
  }
}

function universalLocalUri(uri: string): string {
  // Support both localhost and 127.0.0.1 which is required to work both in a container and macOS.
  return `${uri} ${uri.replace("localhost", "127.0.0.1")}`;
}

const webviewSourceUris =
  "vscode-webview: vscode-resource: https://*.vscode-cdn.net";
