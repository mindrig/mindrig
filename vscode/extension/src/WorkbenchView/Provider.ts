import { setAuthContext } from "@/auth";
import { parsePrompts } from "@mindcontrol/code-parser-wasm";
import type {
  SyncFile,
  SyncMessage,
  SyncResource,
} from "@mindcontrol/vscode-sync";
import * as vscode from "vscode";
import { AIService } from "../AIService";
import { CodeSyncManager } from "../CodeSyncManager";
import { FileManager } from "../FileManager";
import { SecretManager } from "../SecretManager";
import { SettingsManager } from "../SettingsManager";
import { resolveDevServerUri } from "../devServer";
import { WorkbenchWebviewHtmlUris, workbenchWebviewHtml } from "./html";

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
    this.#fileManager?.dispose();
    this.#settingsManager?.dispose();
    this.#secretManager?.dispose();
    this.#codeSyncManager?.dispose();
    this.#aiService?.clearApiKey();
  }

  //#endregion

  //#region Webview

  #webview: vscode.Webview | null = null;
  #currentResourcePath: string | null = null;
  #pendingOpenVercelPanel = false;

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
    this.#sendVercelGatewayKey();

    if (this.#pendingOpenVercelPanel) {
      this.#sendMessage({ type: "openVercelGatewayPanel" });
      this.#pendingOpenVercelPanel = false;
    }

    // Send initial prompts if we have a current file
    if (this.#fileManager) {
      const currentFile = this.#fileManager.getCurrentFile();
      const pinnedFile = this.#fileManager.getPinnedFile();
      const targetFile = pinnedFile || currentFile;
      if (targetFile) this.#parseAndSendPrompts(targetFile);
    }
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

    return workbenchWebviewHtml({ devServer: useDevServer, uris });
  }

  async #devServerUris(): Promise<WorkbenchWebviewHtmlUris> {
    const externalUri = await resolveDevServerUri();
    const baseUri = externalUri.toString().replace(/\/$/, "");

    const csp = [
      "default-src 'none';",
      `img-src ${webviewSources} https: data:;`,
      `script-src ${webviewSources} ${baseUri} 'unsafe-eval' 'unsafe-inline';`,
      `script-src-elem ${webviewSources} ${baseUri} 'unsafe-eval' 'unsafe-inline';`,
      `style-src ${webviewSources} ${baseUri} 'unsafe-inline';`,
      `connect-src ${baseUri} ${import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN} https:;`,
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
      `connect-src ${import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN} https:;`,
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

    // TODO:
    this.#webview.onDidReceiveMessage((message: SyncMessage | any) => {
      switch (message.type) {
        case "addItWorks":
          this.#handleAddItWorks();
          break;
        case "revealPrompt":
          this.#handleRevealPrompt((message as any).payload);
          break;
        case "requestCsvPick":
          this.#handleRequestCsvPick();
          break;
        case "requestAttachmentPick":
          // remember filter preference for this pick operation
          try {
            (this as any).lastAttachmentPickImagesOnly = !!(message as any)
              .payload?.imagesOnly;
          } catch {}
          this.#handleRequestAttachmentPick();
          break;
        case "getModelsDev":
          this.#handleGetModelsDev();
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
        case "getVercelGatewayKey":
          this.#sendVercelGatewayKey();
          break;
        case "setVercelGatewayKey":
          this.#handleSetVercelGatewayKey((message as any).payload);
          break;
        case "clearVercelGatewayKey":
          this.#handleClearVercelGatewayKey();
          break;
        case "sync-update":
          this.#handleSyncUpdate(message);
          break;
        case "sync-state-vector":
          this.#handleSyncStateVector(message);
          break;
        case "sync-init":
          this.#handleRequestSync();
          break;
        case "executePrompt":
          this.#handleExecutePrompt((message as any).payload);
          break;
      }
    });
  }

  // Cache for models.dev data
  #modelsDevCache: any | null = null;

  async #handleGetModelsDev() {
    try {
      if (!this.#modelsDevCache) {
        const resp = await fetch("https://models.dev/api.json");
        if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
        this.#modelsDevCache = await resp.json();
      }
      this.#sendMessage({
        type: "modelsDev",
        payload: { data: this.#modelsDevCache },
      });
    } catch (error) {
      console.error("Failed to fetch models.dev data:", error);
      this.#sendMessage({
        type: "modelsDev",
        payload: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  #sendMessage(message: any) {
    if (this.#webview) this.#webview.postMessage(message);
  }

  async #handleRevealPrompt(payload: {
    file: string;
    selection: { start: number; end: number };
  }) {
    try {
      const uri = vscode.Uri.file(payload.file);
      const doc = await vscode.workspace.openTextDocument(uri);
      const editor = await vscode.window.showTextDocument(doc, {
        preview: false,
        preserveFocus: false,
      });

      const startPos = doc.positionAt(payload.selection.start);
      const endPos = doc.positionAt(payload.selection.end);
      const range = new vscode.Range(startPos, endPos);

      editor.selection = new vscode.Selection(startPos, endPos);
      editor.revealRange(
        range,
        vscode.TextEditorRevealType.InCenterIfOutsideViewport,
      );
    } catch (error) {
      console.error("Failed to reveal prompt:", error);
      void vscode.window.showErrorMessage(
        `Failed to reveal prompt: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // Exposed to extension.ts to open the API key panel
  public openVercelGatewayPanel() {
    if (this.#webview) this.#sendMessage({ type: "openVercelGatewayPanel" });
    else this.#pendingOpenVercelPanel = true;
  }

  //#endregion

  //#region Prompt Parsing

  #cachedPrompts: any[] = [];

  #parseAndSendPrompts(fileState: SyncFile.State) {
    if (!["ts", "js", "py"].includes(fileState.languageId)) {
      this.#sendMessage({
        type: "promptsChanged",
        payload: { prompts: [] },
      });
      return;
    }

    try {
      const parseResult = parsePrompts(fileState.content, fileState.path);

      if (parseResult.state === "success") {
        // Cache successful prompts
        this.#cachedPrompts = parseResult.prompts;
        this.#sendMessage({
          type: "promptsChanged",
          payload: {
            prompts: parseResult.prompts,
            parseStatus: "success",
          },
        });
      } else {
        console.error("Parser returned error:", parseResult.error);
        // Keep existing cached prompts but set status to error
        this.#sendMessage({
          type: "promptsChanged",
          payload: {
            prompts: this.#cachedPrompts,
            parseStatus: "error",
            parseError: parseResult.error,
          },
        });
      }
    } catch (error) {
      // Keep existing cached prompts but set status to error
      console.error("Failed to parse prompts:", error);
      this.#sendMessage({
        type: "promptsChanged",
        payload: {
          prompts: this.#cachedPrompts,
          parseStatus: "error",
          parseError: String(error),
        },
      });
    }
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
        if (fileState) {
          this.#parseAndSendPrompts(fileState);
          this.#syncActiveFile(fileState);
        }
      },
      onFileContentChanged: (fileState) => {
        this.#sendMessage({
          type: "fileContentChanged",
          payload: fileState,
        });
        this.#parseAndSendPrompts(fileState);
        // Note: Don't sync here to avoid conflicts with ongoing edits
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
        const targetFile = pinnedFile || activeFile;
        if (targetFile) this.#parseAndSendPrompts(targetFile);
      },
    });
  }

  #handleAddItWorks() {
    this.#fileManager?.addCommentToActiveFile("// It works!");
  }

  async #handleRequestCsvPick() {
    try {
      const uri = await this.#selectCsvFileWithQuickPick();
      if (!uri) return;
      const data = await vscode.workspace.fs.readFile(uri);
      const content = new TextDecoder("utf-8").decode(data);
      this.#sendMessage({
        type: "csvFileLoaded",
        payload: {
          path: uri.fsPath,
          content,
        },
      });
    } catch (error) {
      console.error("CSV selection failed:", error);
      this.#sendMessage({
        type: "csvFileLoaded",
        payload: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  async #selectCsvFileWithQuickPick(): Promise<vscode.Uri | undefined> {
    if (
      !vscode.workspace.workspaceFolders ||
      vscode.workspace.workspaceFolders.length === 0
    ) {
      const picked = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: "Select CSV",
        filters: { "CSV files": ["csv"], "All files": ["*"] },
      });
      return picked?.[0];
    }

    type CsvItem = vscode.QuickPickItem & { uri: vscode.Uri };
    const quickPick = vscode.window.createQuickPick<CsvItem>();
    quickPick.placeholder = "Search CSV files by name or path";
    quickPick.matchOnDescription = true;
    quickPick.matchOnDetail = true;
    quickPick.ignoreFocusOut = true;

    quickPick.busy = true;
    const excludeGlobs =
      "{**/node_modules/**,**/.git/**,**/dist/**,**/build/**,**/out/**}";
    const maxResults = 2000;
    let uris: vscode.Uri[] = [];
    try {
      uris = await vscode.workspace.findFiles(
        "**/*.csv",
        excludeGlobs,
        maxResults,
      );
    } catch {
      quickPick.dispose();
      const picked = await vscode.window.showOpenDialog({
        canSelectMany: false,
        openLabel: "Select CSV",
        filters: { "CSV files": ["csv"], "All files": ["*"] },
      });
      return picked?.[0];
    }

    const items: CsvItem[] = uris.map((uri) => {
      const rel = vscode.workspace.asRelativePath(uri, false);
      const label = rel.split(/[/\\]/).pop() ?? rel;
      const dir = rel
        .slice(0, Math.max(0, rel.length - label.length))
        .replace(/[/\\]$/, "");
      return { label, description: dir, detail: uri.fsPath, uri };
    });

    if (items.length === 0) {
      quickPick.dispose();
      void vscode.window.showInformationMessage(
        "No CSV files found in this workspace.",
      );
      return undefined;
    }

    quickPick.items = items;
    quickPick.busy = false;

    const selection = await new Promise<CsvItem | undefined>((resolve) => {
      quickPick.onDidAccept(() => resolve(quickPick.selectedItems[0]));
      quickPick.onDidHide(() => resolve(undefined));
      quickPick.show();
    });

    quickPick.dispose();
    return selection?.uri;
  }

  async #handleRequestAttachmentPick() {
    try {
      const imagesOnly = (this as any).lastAttachmentPickImagesOnly ?? false;
      const uris = await vscode.window.showOpenDialog({
        canSelectMany: true,
        openLabel: "Attach",
        title: "Attach files/images",
        filters: {
          ...(imagesOnly
            ? { Images: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"] }
            : {
                "All Files": ["*"],
                Images: ["png", "jpg", "jpeg", "gif", "webp", "bmp", "svg"],
              }),
        },
      });
      if (!uris || uris.length === 0) return;
      const items: Array<{
        path: string;
        name: string;
        mime: string;
        dataBase64: string;
      }> = [];
      for (const uri of uris) {
        const data = await vscode.workspace.fs.readFile(uri);
        const base64 = Buffer.from(data).toString("base64");
        const name = uri.path.split("/").pop() || uri.path;
        const mime = this.#guessMimeFromName(name);
        items.push({ path: uri.fsPath, name, mime, dataBase64: base64 });
      }
      this.#sendMessage({ type: "attachmentsLoaded", payload: { items } });
    } catch (error) {
      console.error("Attachment selection failed:", error);
      this.#sendMessage({
        type: "attachmentsLoaded",
        payload: {
          error: error instanceof Error ? error.message : String(error),
        },
      });
    }
  }

  #guessMimeFromName(name: string): string {
    const lower = name.toLowerCase();
    if (lower.endsWith(".png")) return "image/png";
    if (lower.endsWith(".jpg") || lower.endsWith(".jpeg")) return "image/jpeg";
    if (lower.endsWith(".gif")) return "image/gif";
    if (lower.endsWith(".webp")) return "image/webp";
    if (lower.endsWith(".bmp")) return "image/bmp";
    if (lower.endsWith(".svg")) return "image/svg+xml";
    if (lower.endsWith(".pdf")) return "application/pdf";
    if (lower.endsWith(".txt")) return "text/plain";
    if (lower.endsWith(".json")) return "application/json";
    return "application/octet-stream";
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
        setAuthContext({ loggedIn: !!secret });

        this.#sendMessage({
          type: "vercelGatewayKeyChanged",
          payload: { vercelGatewayKey: secret || null },
        });
      },
    });

    this.#secretManager.getSecret().then((secret) => {
      setAuthContext({ loggedIn: !!secret });
    });
  }

  async #sendVercelGatewayKey() {
    if (!this.#secretManager) return;
    const secret = await this.#secretManager.getSecret();
    this.#sendMessage({
      type: "vercelGatewayKeyChanged",
      payload: { vercelGatewayKey: secret || null },
    });
  }

  async #handleSetVercelGatewayKey(vercelGatewayKey: string) {
    if (!this.#secretManager) return;
    await this.#secretManager.setSecret(vercelGatewayKey);
  }

  async #handleClearVercelGatewayKey() {
    if (!this.#secretManager) return;
    await this.#secretManager.clearSecret();
  }

  // Exposed to extension.ts to clear the stored key
  public async clearVercelGatewayKey() {
    await this.#handleClearVercelGatewayKey();
  }

  //#endregion

  //#region AI Service

  #initializeAIService() {
    this.#aiService = new AIService();
  }

  async #handleExecutePrompt(payload: {
    promptText: string;
    substitutedPrompt: string;
    variables: Record<string, string>;
    promptId: string;
    modelId?: string;
    options?: {
      maxOutputTokens?: number;
      temperature?: number;
      topP?: number;
      topK?: number;
      presencePenalty?: number;
      frequencyPenalty?: number;
      stopSequences?: string[];
      seed?: number;
    };
    tools?: any | null;
    toolChoice?: any;
    providerOptions?: any | null;
    attachments?: Array<{ name: string; mime: string; dataBase64: string }>;
    runSettings?: any;
    runs?: Array<{
      label?: string;
      variables: Record<string, string>;
      substitutedPrompt: string;
    }>;
  }) {
    if (!this.#aiService) this.#initializeAIService();

    // Get the current API key from secret manager
    if (!this.#secretManager) {
      this.#sendMessage({
        type: "promptExecutionResult",
        payload: {
          success: false,
          error: "Secret manager not initialized",
          promptId: payload.promptId,
          timestamp: Date.now(),
          results: [],
        },
      });
      return;
    }

    const apiKey = await this.#secretManager.getSecret();
    if (!apiKey) {
      this.#sendMessage({
        type: "promptExecutionResult",
        payload: {
          success: false,
          error:
            "No Vercel Gateway API key configured. Please set your API key in the panel above.",
          promptId: payload.promptId,
          timestamp: Date.now(),
          results: [],
        },
      });
      return;
    }

    // Set the API key and execute the prompt
    this.#aiService!.setApiKey(apiKey);

    try {
      const runs =
        Array.isArray(payload.runs) && payload.runs.length
          ? payload.runs
          : [
              {
                label: "Run 1",
                variables: payload.variables || {},
                substitutedPrompt: payload.substitutedPrompt,
              },
            ];

      const results = await Promise.all(
        runs.map(async (r) => {
          const result = await this.#aiService!.executePrompt(
            r.substitutedPrompt,
            payload.modelId,
            payload.options,
            {
              tools: payload.tools ?? null,
              toolChoice: payload.toolChoice,
              providerOptions: payload.providerOptions ?? null,
            },
            payload.attachments ?? [],
          );
          if (result.success) {
            return {
              success: true,
              request: result.request,
              response: result.response,
              usage: (result as any).usage,
              totalUsage: (result as any).totalUsage,
              // Surface assistant text output when available
              text: (result as any).text,
              // Include the user message that was sent
              prompt: r.substitutedPrompt,
              label: r.label,
            } as const;
          } else {
            return {
              success: false,
              error: result.error,
              // Include the user message that was intended to be sent
              prompt: r.substitutedPrompt,
              label: r.label,
            } as const;
          }
        }),
      );

      this.#sendMessage({
        type: "promptExecutionResult",
        payload: {
          success: results.every((r) => r.success),
          results,
          promptId: payload.promptId,
          timestamp: Date.now(),
          runSettings: payload.runSettings,
        },
      });
    } catch (error) {
      console.error("Error executing prompt:", error);
      this.#sendMessage({
        type: "promptExecutionResult",
        payload: {
          success: false,
          error: `Unexpected error: ${error instanceof Error ? error.message : String(error)}`,
          promptId: payload.promptId,
          timestamp: Date.now(),
          results: [],
        },
      });
    }
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

  //#region Code Sync Manager

  #codeSyncManager: CodeSyncManager | null = null;
  #aiService: AIService | null = null;

  #initializeCodeSyncManager() {
    this.#codeSyncManager = new CodeSyncManager({
      onDocumentChanged: (content: string) => {
        // Handle changes from VS Code that need to be reflected in webview
        // Note: This should only fire for actual VS Code user edits, not webview sync
      },
      onRemoteChange: (update: Uint8Array) => {
        // Send update to webview
        const message: SyncMessage.Update = {
          type: "sync-update",
          resource: this.#currentResource(),
          payload: { update: Array.from(update) },
        };
        this.#sendMessage(message);
      },
    });
  }

  #handleSyncUpdate(message: SyncMessage.Update) {
    if (!this.#codeSyncManager) return;

    console.log(
      "Extension received sync update from webview",
      JSON.stringify({ updateSize: message.payload.update.length }),
    );
    const update = new Uint8Array(message.payload.update);
    // Apply to VS Code since this update is coming from webview
    this.#codeSyncManager.applyRemoteUpdate(update, true);
  }

  #handleSyncStateVector(message: SyncMessage.StateVector) {
    if (!this.#codeSyncManager) return;

    const stateVector = new Uint8Array(message.payload.stateVector);
    const update = this.#codeSyncManager.getUpdate(stateVector);

    const responseMsg: SyncMessage.Update = {
      type: "sync-update",
      resource: this.#currentResource(),
      payload: { update: Array.from(update) },
    };
    this.#sendMessage(responseMsg);
  }

  #handleRequestSync() {
    if (!this.#codeSyncManager) return;

    const stateVector = this.#codeSyncManager.getStateVector();

    const message: SyncMessage.StateVector = {
      type: "sync-state-vector",
      resource: this.#currentResource(),
      payload: { stateVector: Array.from(stateVector) },
    };
    this.#sendMessage(message);
  }

  #syncActiveFile(fileState: SyncFile.State) {
    // Only enable sync for supported file types to avoid issues
    const supportedLanguages = ["ts", "js", "py"];
    if (!supportedLanguages.includes(fileState.languageId)) return;

    if (!this.#codeSyncManager) this.#initializeCodeSyncManager();

    const uri = vscode.Uri.file(fileState.path);
    this.#codeSyncManager!.setActiveDocument(uri, fileState.content);
    this.#currentResourcePath = fileState.path;

    // Send initial sync state to webview
    this.#handleRequestSync();
  }

  #currentResource(): SyncResource.Code {
    return { type: "code", path: this.#currentResourcePath ?? "" };
  }

  //#endregion
}

const webviewSources =
  "vscode-webview: vscode-resource: https://*.vscode-cdn.net";
