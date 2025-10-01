import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";
import * as VSCode from "vscode";

import { WorkbenchViewProvider } from "../WorkbenchView/Provider";
import { AIService } from "../AIService";

vi.mock("../SecretManager", () => {
  class MockSecretManager {
    #current = "test-api-key";
    #events: { onSecretChanged: (secret: string | undefined) => void };

    constructor(
      _storage: vscode.SecretStorage,
      events: { onSecretChanged: (secret: string | undefined) => void },
    ) {
      this.#events = events;
    }

    dispose() {}

    async getSecret() {
      return this.#current;
    }

    async setSecret(secret: string) {
      this.#current = secret;
      this.#events.onSecretChanged(secret);
    }

    async clearSecret() {
      this.#current = "";
      this.#events.onSecretChanged(undefined);
    }
  }

  return { SecretManager: MockSecretManager };
});

vi.mock("@/auth", () => ({ setAuthContext: vi.fn() }));

vi.mock("@wrkspc/vsc-settings", () => {
  class MockVscSettingsController {
    #onUpdate: ((settings: any) => void) | undefined;
    static section = "mindrig";
    settings: Record<string, unknown> = {};

    constructor(options: { onUpdate?: (settings: any) => void }) {
      this.#onUpdate = options.onUpdate;
      if (this.#onUpdate) this.#onUpdate(this.settings);
    }

    dispose() {}

    update(settings: any) {
      this.settings = settings;
      this.#onUpdate?.(settings);
    }
  }

  return { VscSettingsController: MockVscSettingsController };
});

function createUri(path: string) {
  const joined = path.replace(/\/+/g, "/");
  return {
    fsPath: joined,
    toString: () => joined,
  } as unknown as vscode.Uri;
}

(VSCode.Uri as any).joinPath = (...segments: Array<vscode.Uri | string>) => {
  const combined = segments
    .map((segment) =>
      typeof segment === "string"
        ? segment
        : segment.fsPath ?? segment.toString(),
    )
    .join("/");
  return createUri(combined);
};

(VSCode.workspace as any).fs = {
  readFile: vi.fn().mockRejectedValue(new Error("missing")),
};

(VSCode.workspace as any).onDidChangeConfiguration = vi
  .fn()
  .mockReturnValue({ dispose: vi.fn() });

(VSCode.workspace as any).getConfiguration = vi.fn().mockReturnValue({
  get: vi.fn((key: string, fallback: unknown) => {
    if (key === "run.parallel") return 4;
    return fallback;
  }),
  update: vi.fn(),
});

async function setupProvider() {
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
    get: vi.fn().mockImplementation((_key: string, fallback: boolean) => fallback ?? true),
    update: vi.fn(),
  } as unknown as vscode.Memento;

  const secrets = {
    get: vi.fn().mockResolvedValue("test-api-key"),
    store: vi.fn().mockResolvedValue(undefined),
    delete: vi.fn().mockResolvedValue(undefined),
  } as unknown as vscode.SecretStorage;

  const context = {
    globalState,
    secrets,
    subscriptions: [],
  } as unknown as vscode.ExtensionContext;

  const provider = new WorkbenchViewProvider(
    VSCode.Uri.parse("file:///extension"),
    false,
    context,
  );

  provider.resolveWebviewView(webviewView, {} as any, {} as any);

  const receive = (message: any) => {
    if (!handler) throw new Error("webview handler not registered");
    handler(message);
  };

  const flush = async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
    await Promise.resolve();
  };

  return { provider, posted, receive, flush };
}

async function waitForMessage(posted: any[], type: string, attempts = 10) {
  for (let i = 0; i < attempts; i++) {
    const found = posted.find((msg) => msg.type === type);
    if (found) return found;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  return undefined;
}

describe("WorkbenchViewProvider streaming orchestration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("emits streaming lifecycle messages", async () => {
    vi.spyOn(AIService.prototype, "executePrompt").mockImplementation(
      async (
        prompt: string,
        _modelId,
        _options,
        _extras,
        _attachments,
        runtimeOptions,
      ) => {
        expect(prompt).toBe("Hello world");
        await runtimeOptions?.streamingHandlers?.onTextDelta?.(
          "Hello ",
          { type: "text-delta", text: "Hello " } as any,
        );
        await runtimeOptions?.streamingHandlers?.onTextDelta?.(
          "there!",
          { type: "text-delta", text: "there!" } as any,
        );
        return {
          success: true,
          text: "Hello there!",
          request: {} as any,
          response: {} as any,
        };
      },
    );

    const { receive, posted, flush } = await setupProvider();

    receive({
      type: "executePrompt",
      payload: {
        promptText: "Hello world",
        variables: {},
        promptId: "prompt-1",
        streamingEnabled: true,
      },
    });

    await flush();

    const started = await waitForMessage(posted, "promptRunStarted");
    expect(started).toBeTruthy();
    const runId = started?.payload.runId;
    expect(runId).toBeTruthy();

    const updates = posted.filter((msg) => msg.type === "promptRunUpdate");
    expect(updates).toHaveLength(2);
    expect(updates[0].payload.delta.text).toBe("Hello ");
    expect(updates[1].payload.delta.text).toBe("there!");

    await waitForMessage(posted, "promptRunResultCompleted");
    const resultCompletedMessages = posted.filter(
      (msg) => msg.type === "promptRunResultCompleted",
    );
    expect(resultCompletedMessages).toHaveLength(1);
    expect(resultCompletedMessages[0].payload.result.text).toBe(
      "Hello there!",
    );

    const completed = await waitForMessage(posted, "promptRunCompleted");
    expect(completed?.payload.runId).toBe(runId);
    expect(completed?.payload.success).toBe(true);

    const execution = await waitForMessage(posted, "promptExecutionResult");
    expect(execution?.payload.results[0].text).toBe("Hello there!");
  });

  it("aborts a streaming run when stop is requested", async () => {
    vi.spyOn(AIService.prototype, "executePrompt").mockImplementation(
      async (
        _prompt,
        _modelId,
        _options,
        _extras,
        _attachments,
        runtimeOptions,
      ) => {
        const signal = runtimeOptions?.signal;
        await runtimeOptions?.streamingHandlers?.onTextDelta?.(
          "partial",
          { type: "text-delta", text: "partial" } as any,
        );

        await new Promise<void>((resolve) => {
          if (signal?.aborted) resolve();
          else signal?.addEventListener("abort", () => resolve(), { once: true });
        });

        return { success: false, error: "Prompt run cancelled." };
      },
    );

    const { receive, posted, flush } = await setupProvider();

    receive({
      type: "executePrompt",
      payload: {
        promptText: "Cancel me",
        variables: {},
        promptId: "prompt-2",
        streamingEnabled: true,
      },
    });

    await flush();

    const started = await waitForMessage(posted, "promptRunStarted");
    const runId = started?.payload.runId;
    expect(runId).toBeTruthy();

    receive({ type: "stopPromptRun", payload: { runId } });

    await flush();

    const error = await waitForMessage(posted, "promptRunError");
    expect(error?.payload.error).toContain("cancelled");
    expect(error?.payload.runId).toBe(runId);

    await waitForMessage(posted, "promptRunResultCompleted");
    const resultCompletedMessages = posted.filter(
      (msg) => msg.type === "promptRunResultCompleted",
    );
    expect(resultCompletedMessages.length).toBeGreaterThan(0);
    const cancelledResult = resultCompletedMessages.find(
      (msg) => msg.payload.result.resultId && msg.payload.result.success === false,
    );
    expect(cancelledResult?.payload.result.error).toContain("cancelled");

    const completed = await waitForMessage(posted, "promptRunCompleted");
    expect(completed?.payload.success).toBe(false);
  });

  it("falls back to non-streaming execution", async () => {
    const execSpy = vi
      .spyOn(AIService.prototype, "executePrompt")
      .mockImplementation(
        async (
          _prompt,
          _modelId,
          _options,
          _extras,
          _attachments,
          runtimeOptions,
        ) => {
          expect(runtimeOptions?.streamingHandlers).toBeUndefined();
          return {
            success: true,
            text: "Full output",
            request: {} as any,
            response: {} as any,
          };
        },
      );

    const { receive, posted, flush } = await setupProvider();

    receive({
      type: "executePrompt",
      payload: {
        promptText: "Non streaming",
        variables: {},
        promptId: "prompt-3",
        streamingEnabled: false,
      },
    });

    await flush();

    expect(execSpy).toHaveBeenCalled();
    const updates = posted.filter((msg) => msg.type === "promptRunUpdate");
    expect(updates).toHaveLength(0);

    const started = await waitForMessage(posted, "promptRunStarted");
    expect(started?.payload.streaming).toBe(false);

    await waitForMessage(posted, "promptRunResultCompleted");
    const resultCompletedMessages = posted.filter(
      (msg) => msg.type === "promptRunResultCompleted",
    );
    expect(resultCompletedMessages).toHaveLength(1);
    expect(resultCompletedMessages[0].payload.result.success).toBe(true);

    const completed = await waitForMessage(posted, "promptRunCompleted");
    expect(completed?.payload.success).toBe(true);
    const execution = await waitForMessage(posted, "promptExecutionResult");
    expect(execution?.payload.results[0].text).toBe("Full output");
  });
});
