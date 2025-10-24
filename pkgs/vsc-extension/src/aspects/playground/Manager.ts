import { Manager } from "@/aspects/manager/Manager.js";
import { EditorFile } from "@wrkspc/core/editor";
import { VscMessagePlayground } from "@wrkspc/core/message";
import {
  buildPlaygroundState,
  PlaygroundMap,
  playgroundMapPairToEditorRef,
  PlaygroundState,
} from "@wrkspc/core/playground";
import { always } from "alwaysly";
import { EditorManager } from "../editor/Manager";
import { MessagesManager } from "../message/Manager";
import { PromptsManager } from "../prompt/Manager";
import { StoreManager } from "../store/Manager";
import {
  resolvePlaygroundMap,
  resolvePlaygroundMapPair,
  resolvePlaygroundState,
} from "./resolve";

function createEmptyMap(): PlaygroundMap {
  return { files: {}, updatedAt: Date.now() };
}

export namespace PlaygroundManager {
  export interface Props {
    messages: MessagesManager;
    editor: EditorManager;
    prompts: PromptsManager;
    store: StoreManager;
  }

  export type Resolve = (manager: PlaygroundManager) => void;

  export interface Pin {
    ref: PlaygroundState.Ref;
    file: EditorFile | null;
  }
}

export class PlaygroundManager extends Manager {
  #messages: MessagesManager;
  #editor: EditorManager;
  #prompts: PromptsManager;
  #store: StoreManager;

  #map: PlaygroundMap = createEmptyMap();
  #pin: PlaygroundManager.Pin | null = null;
  #state: PlaygroundState = buildPlaygroundState();

  #hydratePromise: Promise<PlaygroundManager>;
  #hydrateResolve: PlaygroundManager.Resolve | undefined;

  constructor(parent: Manager, props: PlaygroundManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#editor = props.editor;
    this.#prompts = props.prompts;
    this.#store = props.store;

    this.#editor.on(
      this,
      "active-change",
      this.#ensureHydrated(this.#onFileRefUpdate),
    );

    this.#editor.on(
      this,
      "cursor-update",
      this.#ensureHydrated(this.#onFileRefUpdate),
    );

    this.#editor.on(
      this,
      "file-save",
      this.#ensureHydrated(this.#onFileRefUpdate),
    );

    this.#editor.on(
      this,
      "file-update",
      this.#ensureHydrated(this.#onFileUpdate),
    );

    this.#messages.listen(this, "playground-wv-pin", this.#onPin);

    this.#messages.listen(this, "playground-wv-unpin", this.#onUnpin);

    this.#messages.listen(this, "playground-wv-prompt-reveal", this.#onReveal);

    this.#hydratePromise = new Promise(
      (resolve) => (this.#hydrateResolve = resolve),
    );

    this.#hydrate();
  }

  async #hydrate(): Promise<void> {
    const [storedMap, storedPin] = await Promise.all([
      this.#store.get("workspace", "playground.map"),
      this.#store
        .get("workspace", "playground.pin")
        .then((ref) => (ref ? this.#resolvePin(ref) : null)),
    ]);

    if (storedMap) this.#map = storedMap;
    this.#pin = storedPin;

    this.#updateState();

    this.#hydrateResolve?.(this);
  }

  #ensureHydrated<
    Fn extends (...args: Args) => Promise<Return>,
    Args extends any[],
    Return,
  >(fn: Fn): Fn {
    return (async (...args: Args): Promise<Return> => {
      await this.#hydratePromise;
      return fn.apply(this, args);
    }) as Fn;
  }

  get state(): Promise<PlaygroundState> {
    return this.#hydratePromise.then((manager) => manager.#state);
  }

  #updateState(currentFile?: EditorFile | undefined | null): void {
    const file = this.#currentFile(currentFile);
    const parseResult = this.#prompts.parse(file);
    const timestamp = Date.now();

    if (file) {
      this.#map = resolvePlaygroundMap({
        timestamp,
        map: this.#map,
        file,
        parsedPrompts: parseResult.prompts,
      });
      this.#store.set("workspace", "playground.map", this.#map);
    }

    this.#state = resolvePlaygroundState({
      timestamp,
      map: this.#map,
      file,
      parsedPrompts: parseResult.prompts,
      pin: this.#pin?.ref || null,
    });
  }

  #sendState(): Promise<boolean> {
    return this.#messages.send({
      type: "playground-ext-state",
      payload: this.#state,
    });
  }

  #currentFile(activeFile?: EditorFile | undefined | null): EditorFile | null {
    return this.#pin?.file || activeFile || this.#editor.activeFile;
  }

  async #onFileRefUpdate(file: EditorFile | null): Promise<void> {
    if (this.#pin) return;
    this.#updateState(file);
    await this.#sendState();
  }

  async #onFileUpdate(file: EditorFile): Promise<void> {
    this.#updateState(file);
    await this.#sendState();
  }

  async #resolvePin(ref: PlaygroundState.Ref): Promise<PlaygroundManager.Pin> {
    const mapPair = resolvePlaygroundMapPair(this.#map, ref);
    if (!mapPair) return { ref, file: null };

    const [mapFile, mapPrompt] = mapPair;

    if (this.#pin?.file?.path === mapFile.meta.path) {
      return {
        ref,
        file: this.#pin.file,
      };
    } else {
      const file = await this.#editor.readFile(mapFile.meta.path);
      return { ref, file };
    }
  }

  async #onPin(message: VscMessagePlayground.WvPin): Promise<void> {
    this.#pin = await this.#resolvePin(message.payload);
    this.#updateState();
    this.#sendState();
  }

  async #onUnpin(message: VscMessagePlayground.WvUnpin): Promise<void> {
    this.#pin = null;
    this.#updateState();
    this.#sendState();
  }

  #onReveal(message: VscMessagePlayground.WvPromptReveal) {
    const pair = resolvePlaygroundMapPair(this.#map, message.payload);
    always(pair);
    return this.#editor.openFile(playgroundMapPairToEditorRef(pair));
  }
}
