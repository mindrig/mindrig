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

    const uris = useDevServer
      ? await this.#devServerUris()
      : await this.#localPaths(webview);

    return webviewHtml({
      devServer: useDevServer,
      uris,
      initialState: this.#state.state,
    });
  }

  async #devServerUris(): Promise<WebviewHtml.Uris> {
    const externalUri = await resolveDevServerUri();
    const base = externalUri.toString().replace(/\/$/, "");
    // Vite websockets address for HMR
    const wsUri = `ws://${externalUri.authority}`;

    const csp = [
      "default-src 'none';",
      `img-src ${webviewSources} ${base} https: data:;`,
      `script-src ${webviewSources} ${base} 'unsafe-eval' 'unsafe-inline';`,
      `script-src-elem ${webviewSources} ${base} 'unsafe-eval' 'unsafe-inline';`,
      `style-src ${webviewSources} ${base} 'unsafe-inline';`,
      `font-src ${webviewSources} ${base} https: data:;`,
      // TODO: Come up with complete list of authorities rather than slapping global `https:`
      `connect-src ${base} ${import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN} https: ${wsUri};`,
    ].join(" ");

    const app = `${base}/src/index.tsx`;
    const reactRefresh = `${base}/@react-refresh`;
    const viteClient = `${base}/@vite/client`;

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
      `img-src ${webviewSources} https: data:;`,
      `script-src ${webviewSources} 'unsafe-inline';`,
      `style-src ${webviewSources} 'unsafe-inline';`,
      `font-src ${webviewSources} https: data:;`,
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

const webviewSources =
  "vscode-webview: vscode-resource: https://*.vscode-cdn.net";
