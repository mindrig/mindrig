import { Manager } from "@/aspects/manager/Manager.js";
import { VscMessageBus } from "@/aspects/message";
import { WebviewManager } from "@/aspects/webview/Manager";
import { parsePrompts } from "@mindrig/parser-wasm";
import type {
  VscMessage,
  VscMessageAttachments,
  VscMessageAuth,
  VscMessageDataset,
  VscMessagePromptRun,
  VscMessagePrompts,
  VscMessageSettings,
} from "@wrkspc/vsc-message";
import type { SyncFile, SyncResource, VscMessageSync } from "@wrkspc/vsc-sync";
import * as vscode from "vscode";
import { CodeSyncManager } from "../CodeSyncManager";
import { FileManager } from "../FileManager";
import { ModelsDataController } from "../ModelsDataController";

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
  { type: "prompt-run-wv-execute" }
>;

type PromptRunStopMessage = Extract<
  VscMessagePromptRun,
  { type: "prompt-run-vw-stop" }
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

type AuthVercelGatewaySetPayload = Extract<
  VscMessageAuth,
  { type: "auth-ext-vercel-gateway-set" }
>["payload"];

type SettingsStreamingSetPayload = Extract<
  VscMessageSettings,
  { type: "settings-streaming-set" }
>["payload"];

export class WorkbenchViewProvider
  extends Manager
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
    super(null);

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
  #modelsDataController: ModelsDataController | null = null;

  #webviewManager: WebviewManager | null = null;

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.#extensionUri, "dist")],
    };

    this.#webviewManager = new WebviewManager(this, {
      view: webviewView,
      context: this.#context,
    });

    this.#webview = webviewView.webview;
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

    this.#modelsDataController?.refresh();

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

  //#region Messages

  #setupMessageHandling() {
    if (!this.#messageBus) return;

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
      this.#messageBus.on("lifecycle-wv-ready", () =>
        this.#handleWebviewReady(),
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

  async runPromptFromCommand(): Promise<boolean> {
    if (!this.#webview) return false;
    this.#sendMessage({ type: "prompts-execute-from-command" });
    return true;
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

  //#region Secret manager

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
    const enabled =
      typeof payload?.enabled === "boolean" ? payload.enabled : true;
    await this.#context.globalState.update(
      this.#streamingPreferenceKey,
      enabled,
    );
    this.#sendMessage({
      type: "settings-streaming-state",
      payload: { enabled },
    });
  }

  //#endregion

  //#region Code Sync Manager

  #codeSyncManager: CodeSyncManager | null = null;

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
