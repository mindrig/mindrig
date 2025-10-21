import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { PlaygroundManager } from "./Manager";
import type { Prompt } from "@mindrig/types";
import { EditorFile } from "@wrkspc/core/editor";
import type { PlaygroundMap, PlaygroundState } from "@wrkspc/core/playground";
import type { VscMessagePlayground } from "@wrkspc/core/message";
import { Manager } from "@/aspects/manager/Manager.js";
import type { EditorManager as EditorManagerType } from "@/aspects/editor/Manager";
import type { PlaygroundManager as PlaygroundManagerType } from "./Manager";
import type { Store } from "@wrkspc/core/store";
import type { Language } from "@wrkspc/core/lang";
import type { PromptsManager } from "../prompt/Manager";
import type { StoreManager } from "../store/Manager";
import type { MessagesManager } from "../message/Manager";

const LANGUAGE_ID = "ts" as Language.Id;

class StoreStub {
  values = new Map<string, any>();
  sets: Array<{ scope: Store.Scope; key: Store.Key; value: unknown }> = [];
  clears: Array<{ scope: Store.Scope; key: Store.Key }> = [];

  constructor(initial?: Record<string, unknown>) {
    if (initial)
      for (const [key, value] of Object.entries(initial))
        this.values.set(key, value);
  }

  async get<Key extends Store.Key>(
    _scope: Store.Scope,
    key: Key,
  ): Promise<Store[Key] | undefined> {
    return this.values.get(key);
  }

  async set<Key extends Store.Key>(
    scope: Store.Scope,
    key: Key,
    value: Store[Key],
  ): Promise<void> {
    this.values.set(key, value);
    this.sets.push({ scope, key, value });
  }

  async clear<Key extends Store.Key>(
    _scope: Store.Scope,
    key: Key,
  ): Promise<void> {
    this.values.delete(key);
    this.clears.push({ scope: "workspace", key });
  }
}

class MessagesStub extends Manager {
  sent: VscMessagePlayground.Extension[] = [];
  listeners = new Map<string, Array<(message: unknown) => unknown>>();

  constructor() {
    super(null);
  }

  listen(
    _manager: Manager<any> | null,
    type: string,
    callback: (message: unknown) => unknown,
  ): Manager.Disposable {
    const list = this.listeners.get(type) ?? [];
    list.push(callback);
    this.listeners.set(type, list);

    const disposable = {
      dispose: () => {
        const current = this.listeners.get(type);
        if (!current) return;
        const index = current.indexOf(callback);
        if (index !== -1) current.splice(index, 1);
      },
    } satisfies Manager.Disposable;

    return this.register(disposable);
  }

  async send(message: VscMessagePlayground.Extension): Promise<boolean> {
    this.sent.push(message);
    return true;
  }

  emit(type: string, message: unknown) {
    const callbacks = this.listeners.get(type) ?? [];
    for (const callback of callbacks) callback(message);
  }
}

class PromptsStub {
  prompts: Prompt[] = [];

  set(prompts: Prompt[]) {
    this.prompts = prompts;
  }

  get state() {
    return {
      prompts: this.prompts,
      source: { type: "parse" as const },
    };
  }
}

class EditorStub extends Manager<EditorManagerType.EventMap> {
  activeFile: EditorFile | null = null;

  constructor() {
    super(null);
  }

  emitActiveChange(file: EditorFile | null) {
    this.activeFile = file;
    this.emit("active-change", file);
  }

  emitCursorUpdate(file: EditorFile) {
    this.activeFile = file;
    this.emit("cursor-update", file);
  }

  emitFileSave(file: EditorFile) {
    this.emit("file-save", file);
  }

  emitFileUpdate(file: EditorFile) {
    this.emit("file-update", file);
  }
}

interface TestContext {
  messages: MessagesStub;
  editor: EditorStub;
  prompts: PromptsStub;
  store: StoreStub;
  manager: PlaygroundManagerType;
}

function createPrompt(
  content: string,
  overrides: Partial<Prompt> = {},
): Prompt {
  return {
    file: overrides.file ?? "/workspace/file.ts",
    exp: content,
    span: overrides.span ?? {
      outer: { start: 0, end: content.length },
      inner: { start: 0, end: content.length },
    },
    vars: overrides.vars ?? [],
  } satisfies Prompt;
}

function createEditorFile(
  path: string,
  overrides: Partial<EditorFile> = {},
): EditorFile {
  return {
    path: EditorFile.path(path),
    content: overrides.content ?? "",
    isDirty: overrides.isDirty ?? false,
    lastSaved: overrides.lastSaved ?? new Date(),
    languageId: overrides.languageId ?? LANGUAGE_ID,
    cursor: overrides.cursor,
  } satisfies EditorFile;
}

function createMapEntry(
  path: EditorFile.Path,
  prompts: PlaygroundMap.Prompt[],
  updatedAt: number,
): PlaygroundMap {
  return {
    files: {
      [path]: {
        id: "file-id" as PlaygroundMap.FileId,
        path,
        prompts,
        updatedAt,
      },
    },
    updatedAt,
  } satisfies PlaygroundMap;
}

async function flush() {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}

async function waitForMessages(messages: MessagesStub, expected: number) {
  for (let index = 0; index < 6; index += 1) {
    if (messages.sent.length >= expected) return;
    await flush();
  }
}

function setup(
  initialStore?: Record<string, unknown>,
  options?: { file?: EditorFile; prompts?: Prompt[] },
): TestContext {
  const messages = new MessagesStub();
  const editor = new EditorStub();
  const prompts = new PromptsStub();
  const store = new StoreStub(initialStore);

  if (options?.file) editor.activeFile = options.file;
  if (options?.prompts) prompts.set(options.prompts);

  const manager = new PlaygroundManager(messages, {
    messages: messages as unknown as MessagesManager,
    editor: editor as unknown as EditorManagerType,
    prompts: prompts as unknown as PromptsManager,
    store: store as unknown as StoreManager,
  } as PlaygroundManagerType.Props);

  return { messages, editor, prompts, store, manager };
}

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2025-01-01T00:00:00Z"));
});

afterEach(() => {
  vi.useRealTimers();
});

describe(PlaygroundManager, () => {
  it("hydrates map and pin from store", async () => {
    const path = EditorFile.path("/workspace/file.ts");
    const promptEntry = {
      id: "prompt-id" as PlaygroundMap.PromptId,
      content: "alpha",
      updatedAt: Date.now(),
    } satisfies PlaygroundMap.Prompt;
    const storedMap = createMapEntry(path, [promptEntry], Date.now() - 10);
    const storedPin: PlaygroundState.Ref = {
      fileId: path,
      promptId: promptEntry.id,
    };

    const context = setup(
      {
        playground: storedMap,
        "playground.pin": storedPin,
      },
      {
        file: createEditorFile("/workspace/file.ts"),
        prompts: [createPrompt("alpha")],
      },
    );

    await flush();

    const last = context.messages.sent.at(-1);
    expect(last?.type).toBe("playground-ext-state");
    expect(last?.payload.pin).toEqual(storedPin);
  });

  it("updates map and state on active change", async () => {
    const context = setup();
    const file = createEditorFile("/workspace/file.ts");
    const prompt = createPrompt("say hello");
    context.prompts.set([prompt]);

    await flush();
    context.messages.sent = [];

    context.editor.emitActiveChange(file);

    await waitForMessages(context.messages, 1);

    const storedMap = context.store.values.get("playground") as PlaygroundMap;
    expect(storedMap).toBeDefined();
    expect(Object.keys(storedMap.files)).toContain(file.path);

    const last = context.messages.sent.at(-1);
    expect(last?.type).toBe("playground-ext-state");
    expect(last?.payload.prompts).toHaveLength(1);
    expect(last?.payload.prompt?.reason).toBe("cursor");
  });

  it("skips cursor updates when pinned", async () => {
    const file = createEditorFile("/workspace/file.ts");
    const prompt = {
      id: "prompt-id" as PlaygroundMap.PromptId,
      content: "alpha",
      updatedAt: Date.now(),
    } satisfies PlaygroundMap.Prompt;

    const pin: PlaygroundState.Ref = {
      fileId: file.path,
      promptId: prompt.id,
    };

    const context = setup({
      playground: createMapEntry(file.path, [prompt], Date.now()),
      "playground.pin": pin,
    });

    context.prompts.set([createPrompt("alpha")]);
    context.editor.activeFile = file;

    await flush();
    context.messages.sent = [];

    context.editor.emitCursorUpdate(file);
    await waitForMessages(context.messages, 1);

    expect(context.messages.sent).toHaveLength(0);
  });

  it("updates pin via message", async () => {
    const file = createEditorFile("/workspace/file.ts");
    const mapPrompt = {
      id: "prompt-id" as PlaygroundMap.PromptId,
      content: "alpha",
      updatedAt: Date.now(),
    } satisfies PlaygroundMap.Prompt;

    const context = setup({
      playground: createMapEntry(file.path, [mapPrompt], Date.now()),
    });

    context.editor.activeFile = file;
    context.prompts.set([createPrompt("alpha")]);

    await flush();
    context.messages.sent = [];

    context.messages.emit("playground-wv-pin", {
      type: "playground-wv-pin",
      payload: {
        fileId: file.path,
        promptId: mapPrompt.id,
      },
    } as VscMessagePlayground.WvPin);

    await waitForMessages(context.messages, 1);

    const last = context.messages.sent.at(-1);
    expect(last?.payload.pin?.promptId).toBe(mapPrompt.id);
    expect(context.store.values.get("playground.pin")).toEqual({
      fileId: file.path,
      promptId: mapPrompt.id,
    });
  });

  it("handles prompt change without altering pin", async () => {
    const file = createEditorFile("/workspace/file.ts");
    const mapPrompt = {
      id: "prompt-id" as PlaygroundMap.PromptId,
      content: "alpha",
      updatedAt: Date.now(),
    } satisfies PlaygroundMap.Prompt;

    const context = setup({
      playground: createMapEntry(file.path, [mapPrompt], Date.now()),
    });

    context.editor.activeFile = file;
    context.prompts.set([createPrompt("alpha")]);

    await flush();
    context.messages.sent = [];

    context.messages.emit("playground-wv-prompt-change", {
      type: "playground-wv-prompt-change",
      payload: {
        fileId: file.path,
        promptId: mapPrompt.id,
      },
    } as VscMessagePlayground.WvPromptChange);

    await waitForMessages(context.messages, 1);

    const stateMessage = context.messages.sent.at(-1);
    expect(stateMessage?.payload.prompt?.promptId).toBe(mapPrompt.id);
    expect(stateMessage?.payload.prompt?.reason).toBe("cursor");
  });

  it("responds to state requests", async () => {
    const context = setup();
    await flush();
    context.messages.sent = [];

    context.messages.emit("playground-wv-request-state", {
      type: "playground-wv-request-state",
    } as VscMessagePlayground.WvRequestState);

    await waitForMessages(context.messages, 1);
    expect(context.messages.sent.at(-1)?.type).toBe("playground-ext-state");
  });
});
