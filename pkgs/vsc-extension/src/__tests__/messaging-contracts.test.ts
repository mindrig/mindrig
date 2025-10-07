import { beforeEach, describe, expect, it, vi } from "vitest";
import type * as vscode from "vscode";

import { createWorkbenchHarness } from "../testUtils/messages";

vi.mock("../SecretManager", () => {
  class MockSecretManager {
    #current: string | undefined = "api-key";
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
      this.#current = undefined;
      this.#events.onSecretChanged(undefined);
    }
  }

  return { SecretManager: MockSecretManager };
});

vi.mock("@/auth", () => ({ setAuthContext: vi.fn() }));

const fileManagerHooks: {
  options?: {
    onActiveFileChanged?: (fileState: any) => void;
    onFileContentChanged?: (fileState: any) => void;
    onFileSaved?: (fileState: any) => void;
    onCursorPositionChanged?: (fileState: any) => void;
  };
} = {};

vi.mock("../FileManager", () => {
  class MockFileManager {
    constructor(options: (typeof fileManagerHooks)["options"]) {
      if (options) fileManagerHooks.options = options;
      else delete fileManagerHooks.options;
    }

    dispose() {}

    getCurrentFile() {
      return null;
    }
  }

  return { FileManager: MockFileManager };
});

const codeSyncHooks: {
  instance?: {
    onRemoteChange?: (update: Uint8Array) => void;
  };
  appliedUpdates: Uint8Array[];
  lastSetDocument?: { uri: vscode.Uri; content: string };
  lastStateVector?: Uint8Array;
  lastRequestedStateVector?: Uint8Array;
} = { appliedUpdates: [] };

vi.mock("../CodeSyncManager", () => {
  class MockCodeSyncManager {
    #onRemoteChange: (update: Uint8Array) => void;

    constructor(options: { onRemoteChange: (update: Uint8Array) => void }) {
      this.#onRemoteChange = options.onRemoteChange;
      codeSyncHooks.instance = { onRemoteChange: options.onRemoteChange };
    }

    dispose() {}

    setActiveDocument(uri: vscode.Uri, content: string) {
      codeSyncHooks.lastSetDocument = { uri, content };
    }

    getStateVector() {
      const vector = new Uint8Array([1, 2, 3]);
      codeSyncHooks.lastStateVector = vector;
      return vector;
    }

    getUpdate(stateVector: Uint8Array) {
      codeSyncHooks.lastRequestedStateVector = stateVector;
      return new Uint8Array([4, 5]);
    }

    applyRemoteUpdate(update: Uint8Array) {
      codeSyncHooks.appliedUpdates.push(update);
    }

    emitRemoteChange(update: Uint8Array) {
      this.#onRemoteChange(update);
    }
  }

  return { CodeSyncManager: MockCodeSyncManager };
});

describe("WorkbenchViewProvider messaging contracts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    codeSyncHooks.appliedUpdates = [];
    delete codeSyncHooks.lastRequestedStateVector;
    delete codeSyncHooks.lastStateVector;
    delete codeSyncHooks.lastSetDocument;
    delete fileManagerHooks.options;
  });

  it("responds to sync-init with current state vector", async () => {
    const { receive, posted, flush } = await createWorkbenchHarness();

    receive({ type: "lifecycle-wv-ready" });

    const fileState = {
      path: "/workspace/file.ts",
      content: "console.log('hi');",
      languageId: "ts",
    };

    fileManagerHooks.options?.onActiveFileChanged?.(fileState);

    await flush();
    posted.length = 0;

    receive({
      type: "sync-init",
      resource: { type: "code", path: fileState.path },
    });

    await flush();

    const response = posted.find((msg) => msg.type === "sync-state-vector");
    expect(response).toBeTruthy();
    expect(response?.payload.stateVector).toEqual([1, 2, 3]);
  });

  it("persists and echoes streaming preference updates", async () => {
    const { receive, posted, flush, context } = await createWorkbenchHarness();

    receive({
      type: "settings-streaming-set",
      payload: { enabled: false },
    });

    await flush();

    expect(context.globalState.update).toHaveBeenCalledWith(
      "mindrig.workbench.streamingEnabled",
      false,
    );

    const echo = posted.find((msg) => msg.type === "settings-streaming-state");
    expect(echo).toBeTruthy();
    expect(echo?.payload.enabled).toBe(false);
  });

  it("applies inbound sync updates to the code manager", async () => {
    const { receive, flush } = await createWorkbenchHarness();

    receive({ type: "lifecycle-wv-ready" });

    const fileState = {
      path: "/workspace/file.ts",
      content: "console.log('hi');",
      languageId: "ts",
    };

    fileManagerHooks.options?.onActiveFileChanged?.(fileState);
    await flush();

    const syncMessage = {
      type: "sync-update",
      resource: { type: "code", path: fileState.path },
      payload: { update: [7, 8, 9] },
    };
    receive(syncMessage);

    await flush();

    expect(codeSyncHooks.appliedUpdates).toHaveLength(1);
    const [appliedUpdate] = codeSyncHooks.appliedUpdates;
    expect(appliedUpdate).toBeDefined();
    expect(Array.from(appliedUpdate!)).toEqual([7, 8, 9]);
  });
});
