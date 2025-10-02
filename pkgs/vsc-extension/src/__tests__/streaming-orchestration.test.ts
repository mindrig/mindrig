import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";
import * as VSCode from "vscode";

import { AIService } from "../AIService";
import { createWorkbenchHarness, waitForPostedMessage } from "../testUtils/messages";

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

    const { receive, posted, flush } = await createWorkbenchHarness();

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

    const started = await waitForPostedMessage(posted, "promptRunStarted");
    expect(started).toBeTruthy();
    const runId = started?.payload.runId;
    expect(runId).toBeTruthy();

    const updates = posted.filter((msg) => msg.type === "promptRunUpdate");
    expect(updates).toHaveLength(2);
    expect(updates[0].payload.delta.text).toBe("Hello ");
    expect(updates[1].payload.delta.text).toBe("there!");

    await waitForPostedMessage(posted, "promptRunResultCompleted");
    const resultCompletedMessages = posted.filter(
      (msg) => msg.type === "promptRunResultCompleted",
    );
    expect(resultCompletedMessages).toHaveLength(1);
    expect(resultCompletedMessages[0].payload.result.text).toBe(
      "Hello there!",
    );

    const completed = await waitForPostedMessage(posted, "promptRunCompleted");
    expect(completed?.payload.runId).toBe(runId);
    expect(completed?.payload.success).toBe(true);

    const execution = await waitForPostedMessage(posted, "promptExecutionResult");
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

    const { receive, posted, flush } = await createWorkbenchHarness();

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

    const started = await waitForPostedMessage(posted, "promptRunStarted");
    const runId = started?.payload.runId;
    expect(runId).toBeTruthy();

    receive({ type: "stopPromptRun", payload: { runId } });

    await flush();

    const error = await waitForPostedMessage(posted, "promptRunError");
    expect(error?.payload.error).toContain("cancelled");
    expect(error?.payload.runId).toBe(runId);

    await waitForPostedMessage(posted, "promptRunResultCompleted");
    const resultCompletedMessages = posted.filter(
      (msg) => msg.type === "promptRunResultCompleted",
    );
    expect(resultCompletedMessages.length).toBeGreaterThan(0);
    const cancelledResult = resultCompletedMessages.find(
      (msg) => msg.payload.result.resultId && msg.payload.result.success === false,
    );
    expect(cancelledResult?.payload.result.error).toContain("cancelled");

    const completed = await waitForPostedMessage(posted, "promptRunCompleted");
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

    const { receive, posted, flush } = await createWorkbenchHarness();

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

    const started = await waitForPostedMessage(posted, "promptRunStarted");
    expect(started?.payload.streaming).toBe(false);

    await waitForPostedMessage(posted, "promptRunResultCompleted");
    const resultCompletedMessages = posted.filter(
      (msg) => msg.type === "promptRunResultCompleted",
    );
    expect(resultCompletedMessages).toHaveLength(1);
    expect(resultCompletedMessages[0].payload.result.success).toBe(true);

    const completed = await waitForPostedMessage(posted, "promptRunCompleted");
    expect(completed?.payload.success).toBe(true);
    const execution = await waitForPostedMessage(posted, "promptExecutionResult");
    expect(execution?.payload.results[0].text).toBe("Full output");
  });
});
