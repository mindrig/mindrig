import { AssetResolver } from "@/aspects/asset";
import { VscMessageBus } from "@/aspects/message";
import { setAuthContext } from "@/auth";
import { parsePrompts } from "@mindrig/parser-wasm";
import { VscController } from "@wrkspc/vsc-controller";
import { VscSettingsController } from "@wrkspc/vsc-settings";
import type { SyncFile, SyncResource, VscMessageSync } from "@wrkspc/vsc-sync";
import type {
  VscMessage,
  VscMessageAuth,
  VscMessageAttachments,
  VscMessageDataset,
  VscMessageModels,
  VscMessagePrompts,
  VscMessagePromptRun,
  VscMessageSettings,
} from "@wrkspc/vsc-message";
import type {
  PromptRunResultData,
  PromptRunResultShell,
} from "@wrkspc/vsc-types";
import PQueue from "p-queue";
import { nanoid } from "nanoid";
import * as vscode from "vscode";
import { AIService } from "../AIService";
import { CodeSyncManager } from "../CodeSyncManager";
import { FileManager } from "../FileManager";
import { SecretManager } from "../SecretManager";
import { resolveDevServerUri } from "../devServer";
import { WorkbenchWebviewHtmlUris, workbenchWebviewHtml } from "./html";

export type ViteManifest = Record<string, ViteManifestEntry>;

export interface ViteManifestEntry {
  file: string;
  src?: string;
  isEntry?: boolean;
  css?: string[];
  assets?: string[];
}

type PromptRunExecuteMessage = Extract<
  VscMessagePromptRun,
  { type: "prompt-run-execute" }
>;

type PromptRunStopMessage = Extract<
  VscMessagePromptRun,
  { type: "prompt-run-stop" }
>;

type PromptRunStartMessage = Extract<
  VscMessagePromptRun,
  { type: "prompt-run-start" }
>;

type PromptRunUpdateMessage = Extract<
  VscMessagePromptRun,
  { type: "prompt-run-update" }
>;

type PromptRunResultCompleteMessage = Extract<
  VscMessagePromptRun,
  { type: "prompt-run-result-complete" }
>;

type PromptRunCompleteMessage = Extract<
  VscMessagePromptRun,
  { type: "prompt-run-complete" }
>;

type PromptRunErrorMessage = Extract<
  VscMessagePromptRun,
  { type: "prompt-run-error" }
>;

type PromptRunExecutionResultMessage = Extract<
  VscMessagePromptRun,
  { type: "prompt-run-execution-result" }
>;

type ExecutePromptPayload = PromptRunExecuteMessage["payload"];
type StopPromptRunPayload = PromptRunStopMessage["payload"];

type AttachmentsRequestPayload = Extract<
  VscMessageAttachments,
  { type: "attachments-request" }
>["payload"];

type PromptsRevealPayload = Extract<
  VscMessagePrompts,
  { type: "prompts-reveal" }
>["payload"];

type DatasetCsvLoadMessage = Extract<
  VscMessageDataset,
  { type: "dataset-csv-load" }
>;

type ModelsDevResponseMessage = Extract<
  VscMessageModels,
  { type: "models-dev-response" }
>;

type AuthVercelGatewaySetPayload = Extract<
  VscMessageAuth,
  { type: "auth-vercel-gateway-set" }
>["payload"];

type SettingsStreamingSetPayload = Extract<
  VscMessageSettings,
  { type: "settings-streaming-set" }
>["payload"];

export class WorkbenchViewProvider
  extends VscController
  implements vscode.WebviewViewProvider
{
  //#region Static

  public static readonly viewType = "mindrig.playground";

  //#endregion

  //#region Instance

  #isDevelopment: boolean;
  #extensionUri: vscode.Uri;
  #context: vscode.ExtensionContext;
  #manifest: ViteManifest | null | undefined = undefined;
  #streamingPreferenceKey = "mindrig.workbench.streamingEnabled";

  constructor(
    readonly extensionUri: vscode.Uri,
    // NOTE: It is unused at the moment, but keep it for future use
    isDevelopment: boolean,
    context: vscode.ExtensionContext,
  ) {
    super();

    this.#extensionUri = extensionUri;
    this.#isDevelopment = isDevelopment;
    this.#context = context;
  }

  //#endregion

  //#region Webview

  #webview: vscode.Webview | null = null;
  #messageBus: VscMessageBus | null = null;
  #currentResourcePath: string | null = null;
  #pendingOpenVercelPanel = false;
  #lastAttachmentPickImagesOnly = false;
  #lastExecutionPayload: ExecutePromptPayload | null = null;

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.#extensionUri, "dist")],
    };

    this.#webview = webviewView.webview;
    const messageBus = new VscMessageBus(this.#webview, {
      debug: process.env.MINDRIG_DEBUG_MESSAGES === "true",
      onUnhandledMessage: (raw) => {
        console.warn("Received unknown webview message", raw);
      },
    });
    this.#messageBus = messageBus;
    this.register(messageBus);

    this.#setupMessageHandling();
    this.#registerSettings();
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
          type: "file-active-change",
          payload: currentFile,
        });
    }

    this.#sendVercelGatewayKey();

    if (this.#pendingOpenVercelPanel) {
      this.#sendMessage({ type: "auth-panel-open" });
      this.#pendingOpenVercelPanel = false;
    }

    // Send initial prompts if we have a current file
    if (this.#fileManager) {
      const currentFile = this.#fileManager.getCurrentFile();
      if (currentFile) this.#parseAndSendPrompts(currentFile);
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
      : await this.#localPaths(webview);

    return workbenchWebviewHtml({
      devServer: useDevServer,
      uris,
      initialState: {
        settings: this.#settings?.settings,
      },
    });
  }

  async #devServerUris(): Promise<WorkbenchWebviewHtmlUris> {
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

  async #localPaths(
    webview: vscode.Webview,
  ): Promise<WorkbenchWebviewHtmlUris> {
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

  async #loadManifest(): Promise<ViteManifest | null> {
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
    manifest: ViteManifest,
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

  //#endregion

  //#region Messages

  #setupMessageHandling() {
    if (!this.#messageBus) return;

    this.register(
      this.#messageBus.on("dev-add-it-works", () => this.#handleAddItWorks()),
    );

    this.register(
      this.#messageBus.on("prompts-reveal", (message) =>
        this.#handleRevealPrompt(message.payload),
      ),
    );

    this.register(
      this.#messageBus.on("dataset-csv-request", () =>
        this.#handleRequestCsvPick(),
      ),
    );

    this.register(
      this.#messageBus.on("attachments-request", ({ payload }) => {
        const requestPayload: AttachmentsRequestPayload = payload;
        this.#lastAttachmentPickImagesOnly = !!requestPayload?.imagesOnly;
        this.#handleRequestAttachmentPick();
      }),
    );

    this.register(
      this.#messageBus.on("models-dev-get", () => this.#handleGetModelsDev()),
    );

    this.register(
      this.#messageBus.on("lifecycle-webview-ready", () =>
        this.#handleWebviewReady(),
      ),
    );

    this.register(
      this.#messageBus.on("auth-vercel-gateway-get", () =>
        this.#sendVercelGatewayKey(),
      ),
    );

    this.register(
      this.#messageBus.on("auth-vercel-gateway-set", (message) =>
        this.#handleSetVercelGatewayKey(message.payload),
      ),
    );

    this.register(
      this.#messageBus.on("auth-vercel-gateway-clear", () =>
        this.#handleClearVercelGatewayKey(),
      ),
    );

    this.register(
      this.#messageBus.on("settings-streaming-get", () =>
        this.#handleGetStreamingPreference(),
      ),
    );

    this.register(
      this.#messageBus.on("settings-streaming-set", (message) =>
        this.#handleSetStreamingPreference(message.payload),
      ),
    );

    this.register(
      this.#messageBus.on("sync-update", (message) =>
        this.#handleSyncUpdate(message),
      ),
    );

    this.register(
      this.#messageBus.on("sync-state-vector", (message) =>
        this.#handleSyncStateVector(message),
      ),
    );

    this.register(
      this.#messageBus.on("sync-init", () => this.#handleRequestSync()),
    );

    this.register(
      this.#messageBus.on("prompt-run-execute", (message) =>
        this.#handleExecutePrompt(message.payload),
      ),
    );

    this.register(
      this.#messageBus.on("prompt-run-stop", (message) =>
        this.#handleStopPromptRun(message.payload),
      ),
    );
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
      const success: ModelsDevResponseMessage = {
        type: "models-dev-response",
        payload: { status: "ok", data: this.#modelsDevCache },
      };
      this.#sendMessage(success);
    } catch (error) {
      console.error("Failed to fetch models.dev data:", error);
      const failure: ModelsDevResponseMessage = {
        type: "models-dev-response",
        payload: {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        },
      };
      this.#sendMessage(failure);
    }
  }

  #sendMessage<Message extends VscMessage>(message: Message) {
    if (this.#messageBus) {
      void this.#messageBus.send(message);
      return;
    }

    if (this.#webview) {
      void this.#webview.postMessage(message);
    }
  }

  async #handleRevealPrompt(payload: PromptsRevealPayload) {
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
    if (this.#webview) this.#sendMessage({ type: "auth-panel-open" });
    else this.#pendingOpenVercelPanel = true;
  }

  //#endregion

  //#region Prompt Parsing

  #cachedPrompts: any[] = [];

  #parseAndSendPrompts(fileState: SyncFile.State) {
    if (!["ts", "js", "py"].includes(fileState.languageId)) {
      this.#sendMessage({
        type: "prompts-change",
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
          type: "prompts-change",
          payload: {
            prompts: parseResult.prompts,
            parseStatus: "success",
          },
        });
      } else {
        console.error("Parser returned error:", parseResult.error);
        // Keep existing cached prompts but set status to error
        this.#sendMessage({
          type: "prompts-change",
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
        type: "prompts-change",
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
    this.register(
      (this.#fileManager = new FileManager({
        onActiveFileChanged: (fileState) => {
          this.#sendMessage({
            type: "file-active-change",
            payload: fileState,
          });
          if (fileState) {
            this.#parseAndSendPrompts(fileState);
            this.#syncActiveFile(fileState);
          }
        },
        onFileContentChanged: (fileState) => {
          this.#sendMessage({
            type: "file-content-change",
            payload: fileState,
          });
          this.#parseAndSendPrompts(fileState);
          // Note: Don't sync here to avoid conflicts with ongoing edits
        },
        onFileSaved: (fileState) => {
          this.#sendMessage({
            type: "file-save",
            payload: fileState,
          });
        },
        onCursorPositionChanged: (fileState) => {
          this.#sendMessage({
            type: "file-cursor-change",
            payload: fileState,
          });
        },
      })),
    );
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
      const success: DatasetCsvLoadMessage = {
        type: "dataset-csv-load",
        payload: {
          status: "ok",
          path: uri.fsPath,
          content,
        },
      };
      this.#sendMessage(success);
    } catch (error) {
      console.error("CSV selection failed:", error);
      const failure: DatasetCsvLoadMessage = {
        type: "dataset-csv-load",
        payload: {
          status: "error",
          error: error instanceof Error ? error.message : String(error),
        },
      };
      this.#sendMessage(failure);
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
      const imagesOnly = this.#lastAttachmentPickImagesOnly;
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
      this.#sendMessage({
        type: "attachments-load",
        payload: { status: "ok", items },
      });
    } catch (error) {
      console.error("Attachment selection failed:", error);
      this.#sendMessage({
        type: "attachments-load",
        payload: {
          status: "error",
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

  //#region Settings

  #settings: VscSettingsController | null = null;

  #registerSettings() {
    this.register(
      (this.#settings = new VscSettingsController({
        onUpdate: (settings) => {
          this.#sendMessage({ type: "settings-update", payload: settings });
        },
      })),
    );
  }

  //#endregion

  //#region Secret manager

  #secretManager: SecretManager | null = null;

  #initializeSecretManager() {
    this.register(
      (this.#secretManager = new SecretManager(this.#context.secrets, {
        onSecretChanged: (secret) => {
          setAuthContext({ loggedIn: !!secret });

          this.#sendMessage({
            type: "auth-vercel-gateway-state",
            payload: { vercelGatewayKey: secret || null },
          });
        },
      })),
    );

    this.#secretManager.getSecret().then((secret) => {
      setAuthContext({ loggedIn: !!secret });
    });
  }

  async #sendVercelGatewayKey() {
    if (!this.#secretManager) return;
    const secret = await this.#secretManager.getSecret();
    this.#sendMessage({
      type: "auth-vercel-gateway-state",
      payload: { vercelGatewayKey: secret || null },
    });
  }

  async #handleSetVercelGatewayKey(vercelGatewayKey: AuthVercelGatewaySetPayload) {
    if (!this.#secretManager) return;
    await this.#secretManager.setSecret(vercelGatewayKey);
  }

  async #handleClearVercelGatewayKey() {
    if (!this.#secretManager) return;
    await this.#secretManager.clearSecret();
  }

  async #handleGetStreamingPreference() {
    const enabled =
      this.#context.globalState.get<boolean>(
        this.#streamingPreferenceKey,
        true,
      ) ?? true;
    this.#sendMessage({
      type: "settings-streaming-state",
      payload: { enabled },
    });
  }

  async #handleSetStreamingPreference(payload: SettingsStreamingSetPayload) {
    const enabled = typeof payload?.enabled === "boolean" ? payload.enabled : true;
    await this.#context.globalState.update(
      this.#streamingPreferenceKey,
      enabled,
    );
    this.#sendMessage({
      type: "settings-streaming-state",
      payload: { enabled },
    });
  }

  // Exposed to extension.ts to clear the stored key
  public async clearVercelGatewayKey() {
    await this.#handleClearVercelGatewayKey();
  }

  //#endregion

  //#region AI Service

  #initializeAIService() {
    this.register((this.#aiService = new AIService()));
  }

  #cloneExecutionPayload(payload: ExecutePromptPayload): ExecutePromptPayload {
    return JSON.parse(JSON.stringify(payload)) as ExecutePromptPayload;
  }

  async #handleExecutePrompt(payload: ExecutePromptPayload) {
    this.#lastExecutionPayload = this.#cloneExecutionPayload(payload);
    if (!this.#aiService) this.#initializeAIService();

    const runId = nanoid();
    const promptId = payload.promptId;
    const now = () => Date.now();

    const sendRunError = (error: string, resultId?: string) => {
      const payload: PromptRunErrorMessage["payload"] = {
        runId,
        promptId,
        timestamp: now(),
        error,
      };
      if (typeof resultId === "string") payload.resultId = resultId;
      this.#sendMessage({ type: "prompt-run-error", payload });
    };

    const sendRunUpdate = (resultId: string, delta: string) => {
      const message: PromptRunUpdateMessage = {
        type: "prompt-run-update",
        payload: {
          runId,
          promptId,
          resultId,
          timestamp: now(),
          delta: { type: "text", text: delta },
        },
      };
      this.#sendMessage(message);
    };

    if (!this.#secretManager) {
      const error = "Secret manager not initialized";
      sendRunError(error);
      this.#sendMessage({
        type: "prompt-run-execution-result",
        payload: {
          success: false,
          error,
          promptId,
          timestamp: now(),
          results: [],
          runId,
        },
      });
      return;
    }

    const apiKey = await this.#secretManager.getSecret();
    if (!apiKey) {
      const error =
        "No Vercel Gateway API key configured. Please set your API key in the panel above.";
      sendRunError(error);
      this.#sendMessage({
        type: "prompt-run-execution-result",
        payload: {
          success: false,
          error,
          promptId,
          timestamp: now(),
          results: [],
          runId,
        },
      });
      return;
    }

    this.#aiService!.setApiKey(apiKey);

    let streamingEnabled: boolean;
    if (typeof payload.streamingEnabled === "boolean")
      streamingEnabled = payload.streamingEnabled;
    else if ((payload.runSettings as any)?.streaming?.enabled !== undefined)
      streamingEnabled = !!(payload.runSettings as any)?.streaming?.enabled;
    else
      streamingEnabled =
        this.#context.globalState.get<boolean>(
          this.#streamingPreferenceKey,
          true,
        ) ?? true;

    payload.streamingEnabled = streamingEnabled;
    payload.runSettings = {
      ...(payload.runSettings ?? {}),
      streaming: { enabled: streamingEnabled },
    };

    this.#lastExecutionPayload = this.#cloneExecutionPayload(payload);

    try {
      const runs =
        Array.isArray(payload.runs) && payload.runs.length
          ? payload.runs
          : [
              {
                label: "Run 1",
                variables: payload.variables || {},
                substitutedPrompt: payload.promptText,
              },
            ];

      const models =
        Array.isArray(payload.models) && payload.models.length
          ? payload.models
          : [
              {
                key: "default",
                modelId: payload.modelId ?? null,
                providerId: null,
                label: payload.modelId ?? "Default model",
                options: payload.options,
                tools: payload.tools ?? null,
                providerOptions: payload.providerOptions ?? null,
                attachments: payload.attachments ?? [],
                reasoning: {
                  enabled: false,
                  effort: "medium" as const,
                  budgetTokens: "" as const,
                },
              },
            ];

      type ExecutionJob = {
        resultId: string;
        run: (typeof runs)[number];
        runLabel: string;
        modelConfig: (typeof models)[number];
        modelLabel: string;
        attachments: Array<{ name: string; mime: string; dataBase64: string }>;
        reasoning: {
          enabled: boolean;
          effort: "low" | "medium" | "high";
          budgetTokens?: number | "";
        };
        shell: PromptRunResultShell;
      };

      const jobs: ExecutionJob[] = [];
      const shells: PromptRunResultShell[] = [];

      for (const modelConfig of models) {
        const modelLabel = modelConfig.label ?? modelConfig.modelId ?? "Model";
        const reasoning = modelConfig.reasoning ?? {
          enabled: false,
          effort: "medium" as const,
          budgetTokens: "" as const,
        };
        const attachments = Array.isArray(modelConfig.attachments)
          ? modelConfig.attachments
          : [];

        for (const run of runs) {
          const runLabel = run.label ?? "Run";
          const resultId = nanoid();
          const shell: PromptRunResultShell = {
            resultId,
            label: `${modelLabel} • ${runLabel}`,
            runLabel,
            model: {
              key: modelConfig.key,
              id: modelConfig.modelId ?? null,
              providerId: modelConfig.providerId ?? null,
              label: modelConfig.label ?? modelConfig.modelId ?? null,
              settings: {
                options: modelConfig.options,
                reasoning,
                providerOptions: modelConfig.providerOptions ?? null,
                tools: modelConfig.tools ?? null,
                attachments,
              },
            },
            streaming: streamingEnabled,
          };

          jobs.push({
            resultId,
            run,
            runLabel,
            modelConfig,
            modelLabel,
            attachments,
            reasoning,
            shell,
          });
          shells.push(shell);
        }
      }

      const startedMessage: PromptRunStartMessage = {
        type: "prompt-run-start",
        payload: {
          runId,
          promptId,
          timestamp: now(),
          streaming: streamingEnabled,
          results: shells,
          runSettings: payload.runSettings,
        },
      };
      this.#sendMessage(startedMessage);

      if (this.#cancelledRuns.has(runId)) {
        this.#cancelledRuns.delete(runId);
        const cancelMessage = "Prompt run cancelled.";
        sendRunError(cancelMessage);

        const completedMessage: PromptRunCompleteMessage = {
          type: "prompt-run-complete",
          payload: {
            runId,
            promptId,
            timestamp: now(),
            success: false,
            results: [],
          },
        };
        this.#sendMessage(completedMessage);

        this.#sendMessage({
          type: "prompt-run-execution-result",
          payload: {
            success: false,
            error: cancelMessage,
            results: [],
            promptId,
            timestamp: now(),
            runSettings: payload.runSettings,
            runId,
          },
        });
        return;
      }

      const configuration = vscode.workspace.getConfiguration("mindrig");
      const parallelSetting = configuration.get<number | string>(
        "run.parallel",
        4,
      );
      const numericParallel =
        typeof parallelSetting === "number"
          ? parallelSetting
          : Number(parallelSetting);
      const concurrency =
        Number.isFinite(numericParallel) && numericParallel > 0
          ? Math.floor(numericParallel)
          : 1;

      const queue = new PQueue({ concurrency });
      const resultDataById = new Map<string, PromptRunResultData>();

      const enqueueJob = (job: ExecutionJob) =>
        queue.add(async () => {
          if (this.#cancelledRuns.has(runId)) return;

          let streamedText = "";
          let jobErrorReported = false;

          const streamingHandlers = streamingEnabled
            ? {
                onTextDelta: async (delta: string) => {
                  streamedText += delta;
                  sendRunUpdate(job.resultId, delta);
                },
                onError: async (err: unknown) => {
                  const message = this.#formatExecutionError(err);
                  jobErrorReported = true;
                  sendRunError(message, job.resultId);
                },
              }
            : undefined;

          const extras = {
            tools: job.modelConfig.tools ?? null,
            toolChoice: payload.toolChoice,
            providerOptions: job.modelConfig.providerOptions ?? null,
          };

          const controller = new AbortController();
          this.#addRunController(runId, controller);

          const runtimeOptions = {
            signal: controller.signal,
            ...(streamingHandlers ? { streamingHandlers } : {}),
          };

          try {
            const result = await this.#aiService!.executePrompt(
              job.run.substitutedPrompt,
              job.modelConfig.modelId ?? undefined,
              job.modelConfig.options,
              extras,
              job.attachments,
              runtimeOptions,
            );

            if (controller.signal.aborted) {
              this.#cancelledRuns.add(runId);
              return;
            }

            if (result.success) {
              const finalText =
                typeof result.text === "string"
                  ? result.text
                  : streamedText || null;

              const completedResult: PromptRunResultData = {
                resultId: job.resultId,
                success: true,
                prompt: job.run.substitutedPrompt,
                text: finalText,
                label: job.shell.label,
                runLabel: job.runLabel,
                request: result.request,
                response: result.response,
                usage: result.usage,
                totalUsage: result.totalUsage,
                steps: (result as any).steps,
                finishReason: (result as any).finishReason ?? null,
                warnings: (result as any).warnings,
                model: job.shell.model,
              };

              resultDataById.set(job.resultId, completedResult);
              const resultCompletedMessage: PromptRunResultCompleteMessage = {
                type: "prompt-run-result-complete",
                payload: {
                  runId,
                  promptId,
                  timestamp: now(),
                  result: completedResult,
                },
              };
              this.#sendMessage(resultCompletedMessage);
            } else {
              const errorMessage = this.#formatExecutionError(result.error);
              if (!jobErrorReported) sendRunError(errorMessage, job.resultId);

              const failedResult: PromptRunResultData = {
                resultId: job.resultId,
                success: false,
                prompt: job.run.substitutedPrompt,
                text: null,
                label: job.shell.label,
                runLabel: job.runLabel,
                error: errorMessage,
                model: job.shell.model,
              };

              resultDataById.set(job.resultId, failedResult);
              const failureMessage: PromptRunResultCompleteMessage = {
                type: "prompt-run-result-complete",
                payload: {
                  runId,
                  promptId,
                  timestamp: now(),
                  result: failedResult,
                },
              };
              this.#sendMessage(failureMessage);
            }
          } catch (error) {
            if (!controller.signal.aborted) {
              const formatted = this.#formatExecutionError(error);
              if (!jobErrorReported) sendRunError(formatted, job.resultId);

              const failedResult: PromptRunResultData = {
                resultId: job.resultId,
                success: false,
                prompt: job.run.substitutedPrompt,
                text: null,
                label: job.shell.label,
                runLabel: job.runLabel,
                error: formatted,
                model: job.shell.model,
              };

              resultDataById.set(job.resultId, failedResult);
              const failureMessage: PromptRunResultCompleteMessage = {
                type: "prompt-run-result-complete",
                payload: {
                  runId,
                  promptId,
                  timestamp: now(),
                  result: failedResult,
                },
              };
              this.#sendMessage(failureMessage);
            } else {
              this.#cancelledRuns.add(runId);
            }
          } finally {
            this.#removeRunController(runId, controller);
          }
        });

      for (const job of jobs) enqueueJob(job);

      await queue.onIdle();

      const wasCancelled = this.#cancelledRuns.has(runId);

      if (wasCancelled) {
        const cancelMessage = "Prompt run cancelled.";
        for (const job of jobs) {
          if (resultDataById.has(job.resultId)) continue;
          const cancelledResult: PromptRunResultData = {
            resultId: job.resultId,
            success: false,
            prompt: job.run.substitutedPrompt,
            text: null,
            label: job.shell.label,
            runLabel: job.runLabel,
            error: cancelMessage,
            model: job.shell.model,
          };
          resultDataById.set(job.resultId, cancelledResult);
          const cancelledMessage: PromptRunResultCompleteMessage = {
            type: "prompt-run-result-complete",
            payload: {
              runId,
              promptId,
              timestamp: now(),
              result: cancelledResult,
            },
          };
          this.#sendMessage(cancelledMessage);
        }
        sendRunError(cancelMessage);
      }

      const aggregatedResults = jobs
        .map((job) => resultDataById.get(job.resultId))
        .filter((result): result is PromptRunResultData => Boolean(result));

      const overallSuccess =
        aggregatedResults.length > 0 &&
        aggregatedResults.every((result) => result.success);

      this.#activeRunControllers.delete(runId);
      this.#cancelledRuns.delete(runId);

      const completedMessage: PromptRunCompleteMessage = {
        type: "prompt-run-complete",
        payload: {
          runId,
          promptId,
          timestamp: now(),
          success: !wasCancelled && overallSuccess,
          results: aggregatedResults,
        },
      };
      this.#sendMessage(completedMessage);

      this.#sendMessage({
        type: "prompt-run-execution-result",
        payload: {
          success: !wasCancelled && overallSuccess,
          results: aggregatedResults,
          promptId,
          timestamp: now(),
          runSettings: payload.runSettings,
          runId,
        },
      });
    } catch (error) {
      console.error("Error executing prompt:", error);
      const formatted = this.#formatExecutionError(error);
      const message = `Unexpected error: ${formatted}`;
      sendRunError(message);
      this.#activeRunControllers.delete(runId);
      this.#cancelledRuns.delete(runId);
      this.#sendMessage({
        type: "prompt-run-execution-result",
        payload: {
          success: false,
          error: message,
          promptId,
          timestamp: now(),
          results: [],
          runId,
        },
      });
    }
  }

  async runPromptFromCommand(): Promise<boolean> {
    if (!this.#webview) return false;
    this.#sendMessage({ type: "prompts-execute-from-command" });
    return true;
  }

  async rerunLastExecution(): Promise<boolean> {
    if (!this.#lastExecutionPayload) return false;
    const payload = this.#cloneExecutionPayload(this.#lastExecutionPayload);
    await this.#handleExecutePrompt(payload);
    return true;
  }

  #formatExecutionError(error: unknown): string {
    if (typeof error === "string") {
      const normalized = error.startsWith("Failed to execute prompt: ")
        ? error.slice("Failed to execute prompt: ".length)
        : error;
      return normalized;
    }

    if (error instanceof Error) {
      const message = error.message || "Unknown error occurred";

      if (
        error.name === "AbortError" ||
        message.toLowerCase().includes("abort")
      )
        return "Prompt run cancelled.";

      if (
        message.includes("network socket disconnected") ||
        message.includes("TLS connection")
      )
        return "Network connectivity issue. Please check your internet connection and try again.";

      if (
        message.includes("401") ||
        message.toLowerCase().includes("unauthorized")
      )
        return "Invalid API key. Please verify your Vercel Gateway API key is correct.";

      if (message.includes("429"))
        return "Rate limit exceeded. Please wait a moment and try again.";

      if (
        message.includes("500") ||
        message.includes("502") ||
        message.includes("503")
      )
        return "Server error. The Vercel Gateway service may be temporarily unavailable.";

      return message;
    }

    return "Unknown error occurred";
  }

  #handleStopPromptRun(payload: StopPromptRunPayload) {
    const runId = typeof payload?.runId === "string" ? payload.runId : null;
    if (!runId) return;

    const controllers = this.#activeRunControllers.get(runId);
    if (controllers) {
      for (const controller of controllers)
        if (!controller.signal.aborted) controller.abort();
      this.#activeRunControllers.delete(runId);
    }

    this.#cancelledRuns.add(runId);
  }

  //#endregion

  //#region Code Sync Manager

  #addRunController(runId: string, controller: AbortController) {
    const existing = this.#activeRunControllers.get(runId);
    if (existing) existing.add(controller);
    else this.#activeRunControllers.set(runId, new Set([controller]));
  }

  #removeRunController(runId: string, controller: AbortController) {
    const existing = this.#activeRunControllers.get(runId);
    if (!existing) return;
    existing.delete(controller);
    if (existing.size === 0) this.#activeRunControllers.delete(runId);
  }

  #codeSyncManager: CodeSyncManager | null = null;
  #aiService: AIService | null = null;
  #activeRunControllers: Map<string, Set<AbortController>> = new Map();
  #cancelledRuns: Set<string> = new Set();

  #initializeCodeSyncManager() {
    this.register(
      (this.#codeSyncManager = new CodeSyncManager({
        onDocumentChanged: (content: string) => {
          // Handle changes from VS Code that need to be reflected in webview
          // Note: This should only fire for actual VS Code user edits, not webview sync
        },
        onRemoteChange: (update: Uint8Array) => {
          // Send update to webview
          const message: VscMessageSync.Update = {
            type: "sync-update",
            resource: this.#currentResource(),
            payload: { update: Array.from(update) },
          };
          this.#sendMessage(message);
        },
      })),
    );
  }

  #handleSyncUpdate(message: VscMessageSync.Update) {
    if (!this.#codeSyncManager) return;

    console.log(
      "Extension received sync update from webview",
      JSON.stringify({ updateSize: message.payload.update.length }),
    );
    const update = new Uint8Array(message.payload.update);
    // Apply to VS Code since this update is coming from webview
    this.#codeSyncManager.applyRemoteUpdate(update, true);
  }

  #handleSyncStateVector(message: VscMessageSync.StateVector) {
    if (!this.#codeSyncManager) return;

    const stateVector = new Uint8Array(message.payload.stateVector);
    const update = this.#codeSyncManager.getUpdate(stateVector);

    const responseMsg: VscMessageSync.Update = {
      type: "sync-update",
      resource: this.#currentResource(),
      payload: { update: Array.from(update) },
    };
    this.#sendMessage(responseMsg);
  }

  #handleRequestSync() {
    if (!this.#codeSyncManager) return;

    const stateVector = this.#codeSyncManager.getStateVector();

    const message: VscMessageSync.StateVector = {
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
