import type * as vscode from "vscode";
import * as VSCode from "vscode";
import { vi } from "vitest";
import { WorkbenchViewProvider } from "../WorkbenchView/Provider";

export interface WorkbenchHarnessOptions {
  extensionUri?: vscode.Uri;
  globalState?: Partial<vscode.Memento>;
  secrets?: Partial<vscode.SecretStorage>;
}

export interface WorkbenchHarness {
  provider: WorkbenchViewProvider;
  posted: any[];
  receive: (message: any) => void;
  flush: () => Promise<void>;
  context: vscode.ExtensionContext;
  webview: vscode.Webview;
}

function createUri(path: string) {
  const joined = path.replace(/\\+/g, "/");
  return {
    fsPath: joined,
    toString: () => joined,
  } as unknown as vscode.Uri;
}

if (!(VSCode.Uri as any).__mindrig_test_patch) {
  (VSCode.Uri as any).joinPath = (
    ...segments: Array<vscode.Uri | string>
  ) => {
    const combined = segments
      .map((segment) =>
        typeof segment === "string"
          ? segment
          : segment.fsPath ?? segment.toString(),
      )
      .join("/");
    return createUri(combined);
  };
  (VSCode.Uri as any).__mindrig_test_patch = true;
}

(VSCode.workspace as any).fs ??= {
  readFile: () => Promise.reject(new Error("Not implemented")),
};

(VSCode.workspace as any).onDidChangeConfiguration ??= () => ({
  dispose: () => undefined,
});

(VSCode.workspace as any).getConfiguration ??= () => ({
  get: (_key: string, fallback: unknown) => fallback,
  update: () => Promise.resolve(),
});

export async function createWorkbenchHarness(
  options: WorkbenchHarnessOptions = {},
): Promise<WorkbenchHarness> {
  const posted: any[] = [];
  let handler: ((message: any) => void) | undefined;

  const webview = {
    options: {} as vscode.WebviewOptions,
    html: "",
    asWebviewUri: (uri: vscode.Uri) => uri,
    postMessage: vi.fn().mockImplementation((message: any) => {
      posted.push(message);
      return Promise.resolve(true);
    }),
    onDidReceiveMessage: vi.fn().mockImplementation((cb: (msg: any) => void) => {
      handler = cb;
      return { dispose: vi.fn() };
    }),
  } as unknown as vscode.Webview;

  const webviewView = { webview } as unknown as vscode.WebviewView;

  const globalState = {
    get: vi.fn().mockImplementation(
      (_key: string, fallback: boolean) => fallback ?? true,
    ),
    update: vi.fn().mockResolvedValue(undefined),
    ...(options.globalState ?? {}),
  } as unknown as vscode.Memento;

  const secrets = {
    get: vi.fn().mockResolvedValue(""),
    store: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
    ...(options.secrets ?? {}),
  } as unknown as vscode.SecretStorage;

  const context = {
    globalState,
    secrets,
    subscriptions: [],
  } as unknown as vscode.ExtensionContext;

  const provider = new WorkbenchViewProvider(
    options.extensionUri ?? VSCode.Uri.parse("file:///extension"),
    false,
    context,
  );

  provider.resolveWebviewView(webviewView, {} as any, {} as any);

  const receive = (message: any) => {
    if (!handler)
      throw new Error("webview handler not registered before receive call");
    handler(message);
  };

  const flush = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  };

  return { provider, posted, receive, flush, context, webview };
}

export async function waitForPostedMessage(
  posted: any[],
  type: string,
  attempts = 10,
) {
  for (let i = 0; i < attempts; i++) {
    const found = posted.find((msg) => msg.type === type);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return undefined;
}
