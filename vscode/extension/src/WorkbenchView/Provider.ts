import * as vscode from "vscode";
import { WorkbenchWebviewHtmlUris, workbenchWebviewHtml } from "./html";
import { FileManager } from "../FileManager";
import { SecretManager } from "../SecretManager";
import { SettingsManager } from "../SettingsManager";
import { resolveDevServerUri } from "../devServer";

export class WorkbenchViewProvider implements vscode.WebviewViewProvider {
  //#region Static

  public static readonly viewType = "mindcontrol.workbench";

  //#endregion

  //#region Instance

  #isDevelopment: boolean;
  #extensionUri: vscode.Uri;
  #context: vscode.ExtensionContext;

  constructor(
    readonly extensionUri: vscode.Uri,
    // NOTE: It is unused at the moment, but keep it for future use
    isDevelopment: boolean,
    context: vscode.ExtensionContext,
  ) {
    this.#extensionUri = extensionUri;
    this.#isDevelopment = isDevelopment;
    this.#context = context;
  }

  public dispose() {
    if (this.#fileManager) this.#fileManager.dispose();

    if (this.#settingsManager) this.#settingsManager.dispose();

    if (this.#secretManager) this.#secretManager.dispose();
  }

  //#endregion

  //#region Webview

  #webview: vscode.Webview | null = null;

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this.#extensionUri],
    };

    this.#webview = webviewView.webview;
    this.#setupMessageHandling();
    this.#initializeSettingsManager();
    this.#initializeSecretManager();
    this.#applyHtml(webviewView.webview);
  }

  #handleWebviewReady() {
    if (!this.#fileManager) {
      this.#initializeFileManager();
    } else {
      const currentFile = this.#fileManager.getCurrentFile();
      if (currentFile)
        this.#sendMessage({
          type: "activeFileChanged",
          payload: currentFile,
        });

      if (this.#fileManager.isPinnedState())
        this.#sendMessage({
          type: "pinStateChanged",
          payload: {
            pinnedFile: this.#fileManager.getPinnedFile(),
            activeFile: this.#fileManager.getCurrentFile(),
            isPinned: true,
          },
        });
    }

    this.#sendSettings();
    this.#sendSecret();
  }

  //#endregion

  //#region HTML

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

  //#endregion

  //#region Messages

  #setupMessageHandling() {
    if (!this.#webview) return;

    this.#webview.onDidReceiveMessage((message) => {
      switch (message.type) {
        case "addItWorks":
          this.#handleAddItWorks();
          break;
        case "getSettings":
          this.#sendSettings();
          break;
        case "webviewReady":
          this.#handleWebviewReady();
          break;
        case "pinFile":
          this.#handlePinFile();
          break;
        case "unpinFile":
          this.#handleUnpinFile();
          break;
        case "getSecret":
          this.#sendSecret();
          break;
        case "setSecret":
          this.#handleSetSecret(message.payload);
          break;
        case "clearSecret":
          this.#handleClearSecret();
          break;
      }
    });
  }

  #sendMessage(message: any) {
    if (this.#webview) this.#webview.postMessage(message);
  }

  //#endregion

  //#region File manager

  #fileManager: FileManager | null = null;

  #initializeFileManager() {
    this.#fileManager = new FileManager({
      onActiveFileChanged: (fileState) => {
        this.#sendMessage({
          type: "activeFileChanged",
          payload: fileState,
        });
      },
      onFileContentChanged: (fileState) => {
        this.#sendMessage({
          type: "fileContentChanged",
          payload: fileState,
        });
      },
      onFileSaved: (fileState) => {
        this.#sendMessage({
          type: "fileSaved",
          payload: fileState,
        });
      },
      onCursorPositionChanged: (fileState) => {
        this.#sendMessage({
          type: "cursorPositionChanged",
          payload: fileState,
        });
      },
      onPinStateChanged: (pinnedFile, activeFile) => {
        this.#sendMessage({
          type: "pinStateChanged",
          payload: {
            pinnedFile,
            activeFile,
            isPinned: pinnedFile !== null,
          },
        });
      },
    });
  }

  #handleAddItWorks() {
    this.#fileManager?.addCommentToActiveFile("// It works!");
  }

  //#endregion

  //#region Settings manager

  #settingsManager: SettingsManager | null = null;

  #initializeSettingsManager() {
    this.#settingsManager = new SettingsManager({
      onSettingsChanged: (settings) => {
        this.#sendMessage({
          type: "settingsChanged",
          payload: settings,
        });
      },
    });
  }

  #sendSettings() {
    if (!this.#settingsManager) return;
    const settings = this.#settingsManager.settings;
    this.#sendMessage({
      type: "settingsChanged",
      payload: settings,
    });
  }

  //#endregion

  //#region Secret manager

  #secretManager: SecretManager | null = null;

  #initializeSecretManager() {
    this.#secretManager = new SecretManager(this.#context.secrets, {
      onSecretChanged: (secret) => {
        this.#sendMessage({
          type: "secretChanged",
          payload: { secret: secret || null },
        });
      },
    });
  }

  async #sendSecret() {
    if (!this.#secretManager) return;
    const secret = await this.#secretManager.getSecret();
    this.#sendMessage({
      type: "secretChanged",
      payload: { secret: secret || null },
    });
  }

  async #handleSetSecret(secret: string) {
    if (!this.#secretManager) return;
    await this.#secretManager.setSecret(secret);
  }

  async #handleClearSecret() {
    if (!this.#secretManager) return;
    await this.#secretManager.clearSecret();
  }

  //#endregion

  //#region Pinning

  #handlePinFile() {
    this.#fileManager?.pinCurrentFile();
  }

  #handleUnpinFile() {
    this.#fileManager?.unpinFile();
  }

  //#endregion
}

const webviewSources =
  "vscode-webview: vscode-resource: https://*.vscode-cdn.net";
