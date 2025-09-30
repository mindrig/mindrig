import { AssetResolver } from "@/aspects/asset";
import { setAuthContext } from "@/auth";
import { parsePrompts } from "@mindrig/parser-wasm";
import { VscController } from "@wrkspc/vsc-controller";
import { VscSettingsController } from "@wrkspc/vsc-settings";
import type { SyncFile, SyncMessage, SyncResource } from "@wrkspc/vsc-sync";
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

interface ExecutePromptPayload {
  promptText: string;
  variables: Record<string, string>;
  promptId: string;
  modelId?: string | null;
  runs?: Array<{
    label?: string;
    variables: Record<string, string>;
    substitutedPrompt: string;
  }>;
  models?: Array<{
    key: string;
    modelId: string | null;
    providerId?: string | null;
    label?: string | null;
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
    providerOptions?: any | null;
    attachments?: Array<{ name: string; mime: string; dataBase64: string }>;
    reasoning?: {
      enabled: boolean;
      effort: "low" | "medium" | "high";
      budgetTokens?: number | "";
    };
  }>;
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
}

export class WorkbenchViewProvider
  extends VscController
  implements vscode.WebviewViewProvider
{
  //#region Static

  public static readonly viewType = "mindcontrol.workbench";

  //#endregion

  //#region Instance

  #isDevelopment: boolean;
  #extensionUri: vscode.Uri;
  #context: vscode.ExtensionContext;
  #manifest: ViteManifest | null | undefined = undefined;

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
  #currentResourcePath: string | null = null;
  #pendingOpenVercelPanel = false;
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
          type: "activeFileChanged",
          payload: currentFile,
        });
    }

    this.#sendVercelGatewayKey();

    if (this.#pendingOpenVercelPanel) {
      this.#sendMessage({ type: "openVercelGatewayPanel" });
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
      // TODO: Come up with complete list of authorities rather than slapping global `https:`
      `connect-src ${base} ${import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN} https: ${wsUri}`,
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
        case "webviewReady":
          this.#handleWebviewReady();
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
    this.register(
      (this.#fileManager = new FileManager({
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

  //#region Settings

  #settings: VscSettingsController | null = null;

  #registerSettings() {
    this.register(
      (this.#settings = new VscSettingsController({
        onUpdate: (settings) => {
          this.#sendMessage({ type: "settingsUpdated", payload: settings });
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
            type: "vercelGatewayKeyChanged",
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
    this.register((this.#aiService = new AIService()));
  }

  #cloneExecutionPayload(payload: ExecutePromptPayload): ExecutePromptPayload {
    return JSON.parse(JSON.stringify(payload)) as ExecutePromptPayload;
  }

  async #handleExecutePrompt(payload: ExecutePromptPayload) {
    this.#lastExecutionPayload = this.#cloneExecutionPayload(payload);
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

      const aggregatedResults: Array<{
        success: boolean;
        request?: unknown;
        response?: unknown;
        usage?: unknown;
        totalUsage?: unknown;
        text?: string | null;
        prompt: string | null;
        label?: string;
        runLabel?: string;
        error?: string | null;
        model: {
          key: string;
          id: string | null;
          providerId: string | null;
          label?: string | null;
          settings: {
            options?: unknown;
            reasoning?: {
              enabled: boolean;
              effort: "low" | "medium" | "high";
              budgetTokens?: number | "";
            };
            providerOptions?: unknown;
            tools?: unknown;
            attachments?: Array<{
              name: string;
              mime?: string;
              dataBase64?: string;
            }>;
          };
        };
      }> = [];

      for (const modelConfig of models) {
        const modelLabel = modelConfig.label ?? modelConfig.modelId ?? "Model";
        const reasoning = modelConfig.reasoning ?? {
          enabled: false,
          effort: "medium" as const,
          budgetTokens: "" as const,
        };
        const extras = {
          tools: modelConfig.tools ?? null,
          toolChoice: payload.toolChoice,
          providerOptions: modelConfig.providerOptions ?? null,
        };
        const attachments = Array.isArray(modelConfig.attachments)
          ? modelConfig.attachments
          : [];

        for (const run of runs) {
          const runLabel = run.label ?? "Run";
          const result = await this.#aiService!.executePrompt(
            run.substitutedPrompt,
            modelConfig.modelId ?? undefined,
            modelConfig.options,
            extras,
            attachments,
          );

          if (result.success)
            aggregatedResults.push({
              success: true,
              request: result.request,
              response: result.response,
              usage: (result as any).usage,
              totalUsage: (result as any).totalUsage,
              text: (result as any).text,
              prompt: run.substitutedPrompt,
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
            });
          else
            aggregatedResults.push({
              success: false,
              error: result.error,
              prompt: run.substitutedPrompt,
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
            });
        }
      }

      this.#sendMessage({
        type: "promptExecutionResult",
        payload: {
          success: aggregatedResults.every((r) => r.success),
          results: aggregatedResults,
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

  async runPromptFromCommand(): Promise<boolean> {
    if (!this.#webview) return false;
    this.#sendMessage({ type: "executePromptFromCommand" });
    return true;
  }

  async rerunLastExecution(): Promise<boolean> {
    if (!this.#lastExecutionPayload) return false;
    const payload = this.#cloneExecutionPayload(this.#lastExecutionPayload);
    await this.#handleExecutePrompt(payload);
    return true;
  }

  //#endregion

  //#region Code Sync Manager

  #codeSyncManager: CodeSyncManager | null = null;
  #aiService: AIService | null = null;

  #initializeCodeSyncManager() {
    this.register(
      (this.#codeSyncManager = new CodeSyncManager({
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
      })),
    );
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
