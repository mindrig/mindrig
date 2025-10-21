import { Manager } from "@/aspects/manager/Manager.js";
import { EditorManager } from "../editor/Manager";
import { PromptsManager } from "../prompt/Manager";
import { MessagesManager } from "../message/Manager";
import { StoreManager } from "../store/Manager";
import { EditorFile } from "@wrkspc/core/editor";
import { PlaygroundMap, PlaygroundState } from "@wrkspc/core/playground";
import { VscMessagePlayground } from "@wrkspc/core/message";
import type { Prompt } from "@mindrig/types";
import { resolveFilePromptsMap, resolvePlaygroundState } from "./resolve.js";

const STORE_KEY_MAP = "playground";
const STORE_KEY_PIN = "playground.pin";

const EMPTY_STATE: PlaygroundState = {
  file: null,
  prompt: null,
  prompts: [],
  pin: null,
};

function createEmptyMap(): PlaygroundMap {
  return { files: {}, updatedAt: 0 };
}

function isSameRef(
  left: PlaygroundState.Ref | null,
  right: PlaygroundState.Ref | null,
): boolean {
  if (!left || !right) return left === right;
  return left.fileId === right.fileId && left.promptId === right.promptId;
}

export namespace PlaygroundManager {
  export interface Props {
    messages: MessagesManager;
    editor: EditorManager;
    prompts: PromptsManager;
    store: StoreManager;
  }
}

export class PlaygroundManager extends Manager {
  #messages: MessagesManager;
  #editor: EditorManager;
  #prompts: PromptsManager;
  #store: StoreManager;

  #map: PlaygroundMap = createEmptyMap();
  #pin: PlaygroundState.Ref | null = null;
  #state: PlaygroundState = { ...EMPTY_STATE };
  #parsedPrompts: Prompt[] = [];
  #parsedPath: EditorFile.Path | null = null;

  #ready: Promise<void>;
  #queue: Promise<void> = Promise.resolve();

  constructor(parent: Manager, props: PlaygroundManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#editor = props.editor;
    this.#prompts = props.prompts;
    this.#store = props.store;

    this.#ready = this.#hydrate();

    this.#editor.on(this, "active-change", (file) => {
      this.#enqueue(() => this.#onActiveChange(file));
    });

    this.#editor.on(this, "cursor-update", (file) => {
      this.#enqueue(() => this.#onCursorUpdate(file));
    });

    this.#editor.on(this, "file-save", (file) => {
      this.#enqueue(() => this.#onFileSave(file));
    });

    this.#editor.on(this, "file-update", (file) => {
      this.#enqueue(() => this.#onFileUpdate(file));
    });

    this.#messages.listen(this, "playground-wv-request-state", () => {
      this.#enqueue(() => this.#onRequestState());
    });

    this.#messages.listen(this, "playground-wv-pin", (message) => {
      this.#enqueue(() => this.#onPin(message));
    });

    this.#messages.listen(this, "playground-wv-unpin", () => {
      this.#enqueue(() => this.#onUnpin());
    });

    this.#messages.listen(this, "playground-wv-prompt-change", (message) => {
      this.#enqueue(() => this.#onPromptChange(message));
    });
  }

  get state(): PlaygroundState {
    return this.#state;
  }

  async #hydrate(): Promise<void> {
    const [storedMap, storedPin] = await Promise.all([
      this.#store.get("workspace", STORE_KEY_MAP),
      this.#store.get("workspace", STORE_KEY_PIN),
    ]);

    if (storedMap) this.#map = storedMap;
    if (storedPin !== undefined) this.#pin = storedPin;

    await this.#refreshState({ forceParse: true });
  }

  #enqueue(task: () => Promise<void>) {
    this.#queue = this.#queue
      .then(async () => {
        await this.#ready;
        await task();
      })
      .catch((error) => {
        console.error("[PlaygroundManager]", error);
      });
  }

  async #onActiveChange(file: EditorFile | null): Promise<void> {
    if (this.#pin) return;
    if (!file) {
      this.#parsedPrompts = [];
      this.#parsedPath = null;
      await this.#updateState(null, [], Date.now());
      return;
    }

    const timestamp = Date.now();
    const parsedPrompts = this.#getPrompts(file, { force: true });
    await this.#updateMap(file, parsedPrompts, timestamp);
    await this.#updateState(file, parsedPrompts, timestamp);
  }

  async #onCursorUpdate(file: EditorFile): Promise<void> {
    if (this.#pin) return;
    const timestamp = Date.now();
    const parsedPrompts = this.#getPrompts(file, { force: false });
    await this.#updateState(file, parsedPrompts, timestamp);
  }

  async #onFileSave(file: EditorFile): Promise<void> {
    const isPinned = this.#pin && this.#pin.fileId === file.path;
    if (this.#pin && !isPinned) return;

    const timestamp = Date.now();
    const parsedPrompts = this.#getPrompts(file, { force: true });
    await this.#updateMap(file, parsedPrompts, timestamp);
    await this.#updateState(file, parsedPrompts, timestamp);
  }

  async #onFileUpdate(file: EditorFile): Promise<void> {
    const isPinned = this.#pin && this.#pin.fileId === file.path;
    if (this.#pin && !isPinned) return;

    const timestamp = Date.now();
    const parsedPrompts = this.#getPrompts(file, { force: true });
    await this.#updateMap(file, parsedPrompts, timestamp);
    await this.#updateState(file, parsedPrompts, timestamp);
  }

  async #onRequestState(): Promise<void> {
    await this.#broadcastState();
  }

  async #onPin(message: VscMessagePlayground.WvPin): Promise<void> {
    const resolved = this.#locatePrompt(message.payload);
    if (!resolved) return;

    await this.#setPin(message.payload);
    const file = this.#editor.activeFile;
    const parsedPrompts = this.#getPrompts(file, { force: false });
    await this.#updateState(file, parsedPrompts, Date.now());
  }

  async #onUnpin(): Promise<void> {
    await this.#setPin(null);
    const file = this.#editor.activeFile;
    const parsedPrompts = this.#getPrompts(file, { force: false });
    await this.#updateState(file, parsedPrompts, Date.now());
  }

  async #onPromptChange(
    message: VscMessagePlayground.WvPromptChange,
  ): Promise<void> {
    const resolved = this.#locatePrompt(message.payload);
    if (!resolved) return;

    const reason: PlaygroundState.PromptReason =
      this.#pin &&
      this.#pin.fileId === message.payload.fileId &&
      this.#pin.promptId === message.payload.promptId
        ? "pinned"
        : "cursor";

    this.#state = {
      ...this.#state,
      prompt: {
        fileId: message.payload.fileId,
        promptId: resolved.prompt.id,
        content: resolved.prompt.content,
        reason,
      },
      pin: this.#pin,
    };

    await this.#broadcastState();
  }

  async #refreshState(options: { forceParse: boolean }): Promise<void> {
    const file = this.#editor.activeFile;
    const parsedPrompts = this.#getPrompts(file, {
      force: options.forceParse,
    });
    const timestamp = Date.now();

    if (file) await this.#updateMap(file, parsedPrompts, timestamp);
    await this.#updateState(file, parsedPrompts, timestamp);
  }

  async #updateMap(
    file: EditorFile,
    parsedPrompts: Prompt[],
    timestamp: number,
  ): Promise<void> {
    const nextMap = resolveFilePromptsMap({
      timestamp,
      map: this.#map,
      file,
      parsedPrompts,
    });

    if (nextMap !== this.#map) {
      this.#map = nextMap;
      await this.#store.set("workspace", STORE_KEY_MAP, this.#map);
    }
  }

  async #updateState(
    file: EditorFile | null,
    parsedPrompts: Prompt[],
    timestamp: number,
  ): Promise<void> {
    const nextState = resolvePlaygroundState({
      timestamp,
      map: this.#map,
      file,
      parsedPrompts,
      pin: this.#pin,
    });

    await this.#setPin(nextState.pin);

    this.#state = nextState;
    await this.#broadcastState();
  }

  async #setPin(pin: PlaygroundState.Ref | null): Promise<void> {
    if (isSameRef(this.#pin, pin)) {
      this.#pin = pin;
      return;
    }

    this.#pin = pin;

    if (pin) await this.#store.set("workspace", STORE_KEY_PIN, pin);
    else await this.#store.clear("workspace", STORE_KEY_PIN);
  }

  async #broadcastState(): Promise<void> {
    await this.#messages.send({
      type: "playground-ext-state",
      payload: this.#state,
    });
  }

  #getPrompts(file: EditorFile | null, options: { force: boolean }): Prompt[] {
    if (!file) {
      this.#parsedPrompts = [];
      this.#parsedPath = null;
      return this.#parsedPrompts;
    }

    if (!options.force && this.#parsedPath === file.path) {
      return this.#parsedPrompts;
    }

    const { prompts } = this.#prompts.state;
    this.#parsedPrompts = prompts;
    this.#parsedPath = file.path;
    return this.#parsedPrompts;
  }

  #locatePrompt(ref: PlaygroundState.Ref) {
    const mapFile = this.#map.files[ref.fileId];
    if (!mapFile) return null;
    const prompt = mapFile.prompts.find((item) => item.id === ref.promptId);
    if (!prompt) return null;
    return { file: mapFile, prompt };
  }
}
