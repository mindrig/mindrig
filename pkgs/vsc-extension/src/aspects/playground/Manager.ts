import { Manager } from "@/aspects/manager/Manager.js";
import { EditorFile } from "@wrkspc/core/editor";
import {
  buildMapPromptId,
  buildPlaygroundState,
  PlaygroundMap,
  playgroundMapPairToEditorRef,
  PlaygroundMessage,
  PlaygroundState,
} from "@wrkspc/core/playground";
import { Store } from "@wrkspc/core/store";
import { always } from "alwaysly";
import { log } from "smollog";
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
  return { v: 1, files: {}, updatedAt: Date.now() };
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
  #drafts: Store.Drafts = {};
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
      this.#ensureHydrated(this.#onActiveChange),
    );

    this.#editor.on(
      this,
      "cursor-update",
      this.#ensureHydrated(this.#onCursorUpdate),
    );

    this.#editor.on(this, "file-save", this.#ensureHydrated(this.#onFileSave));

    this.#editor.on(
      this,
      "file-update",
      this.#ensureHydrated(this.#onFileUpdate),
    );

    this.#messages.listen(
      this,
      "playground-client-pin",
      this.#ensureHydrated(this.#onPin),
    );

    this.#messages.listen(
      this,
      "playground-client-unpin",
      this.#ensureHydrated(this.#onUnpin),
    );

    this.#messages.listen(
      this,
      "playground-client-prompt-change",
      this.#onPromptChange,
    );

    this.#messages.listen(
      this,
      "playground-client-new-draft",
      this.#ensureHydrated(this.#onNewDraft),
    );

    this.#messages.listen(
      this,
      "playground-client-draft-update",
      this.#ensureHydrated(this.#onDraftUpdate),
    );

    this.#messages.listen(
      this,
      "playground-client-draft-delete",
      this.#ensureHydrated(this.#onDraftDelete),
    );

    this.#hydratePromise = new Promise(
      (resolve) => (this.#hydrateResolve = resolve),
    );

    this.#hydrate();
  }

  async #hydrate(): Promise<void> {
    const [storedMap, storedPin, storedDrafts] = await Promise.all([
      this.#store.get("workspace", "playground.map"),
      this.#store
        .get("workspace", "playground.pin")
        .then((ref) => (ref ? this.#resolvePin(ref) : null)),
      this.#store.get("workspace", "playground.drafts"),
    ]);

    if (storedMap) this.#map = storedMap;
    this.#pin = storedPin;
    if (storedDrafts) this.#drafts = storedDrafts;

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

  #updateState(editorFileArg?: EditorFile | undefined | null): void {
    const currentFile = this.#currentFile(editorFileArg);
    const editorFile = this.#editorFile(editorFileArg);
    const parseResult = this.#prompts.parse(currentFile);

    const parseError =
      (parseResult.source.type === "cache" &&
        parseResult.source.reason.type === "invalid" &&
        parseResult.source.reason.error) ||
      null;

    const timestamp = Date.now();

    if (currentFile) {
      this.#map = resolvePlaygroundMap({
        timestamp,
        map: this.#map,
        file: currentFile,
        parsedPrompts: parseResult.prompts,
      });
      this.#store.set("workspace", "playground.map", this.#map);
    }

    const pinRef = this.#pin?.ref;
    const pin =
      pinRef && (!pinRef.type || pinRef.type === "code") ? pinRef : null;

    const nextState = resolvePlaygroundState({
      timestamp,
      map: this.#map,
      drafts: this.#drafts,
      editorFile,
      currentFile,
      parsedPrompts: parseResult.prompts,
      pin: this.#pin?.ref || null,
      parseError,
    });

    log.debug("Updating playground state", nextState);

    this.#state = nextState;
  }

  #sendState(): Promise<boolean> {
    return this.#messages.send({
      type: "playground-server-update",
      payload: this.#state,
    });
  }

  #editorFile(editorFile: EditorFile | undefined | null): EditorFile | null {
    return editorFile || this.#editor.activeFile;
  }

  #currentFile(editorFile?: EditorFile | undefined | null): EditorFile | null {
    return this.#pin?.file || this.#editorFile(editorFile);
  }

  #onActiveChange(file: EditorFile | null): Promise<void> {
    log.debug("Active file changed", file?.path);
    return this.#handleFileRefUpdate(file);
  }

  #onCursorUpdate(file: EditorFile): Promise<void> {
    log.debug("Cursor updated", file.path, file.cursor);
    return this.#handleFileRefUpdate(file);
  }

  #onFileSave(file: EditorFile): Promise<void> {
    log.debug("File saved", file.path);
    return this.#handleFileRefUpdate(file);
  }

  async #onFileUpdate(file: EditorFile): Promise<void> {
    log.debug("File updated", file.path, file.content);
    this.#updateState(file);
    await this.#sendState();
  }

  async #handleFileRefUpdate(file: EditorFile | null): Promise<void> {
    this.#updateState(file);
    await this.#sendState();
  }

  async #onPromptChange(message: PlaygroundMessage.ClientPromptChange) {
    if (!message.payload) {
      if (!this.#pin) return;
      this.#pin = null;
      this.#updateState(this.#editor.activeFile);
      await this.#sendState();
      return;
    }

    const ref = message.payload;
    if (!ref.type || ref.type === "code") {
      const pair = resolvePlaygroundMapPair(this.#map, ref);
      always(pair);
      const file = await this.#editor.openFile(
        playgroundMapPairToEditorRef(pair),
      );
      if (file && this.#pin) this.#pin = { ref: message.payload, file };
    } else {
      this.#pin = { ref, file: null };
    }

    this.#updateState();
    await this.#sendState();
  }

  async #resolvePin(ref: PlaygroundState.Ref): Promise<PlaygroundManager.Pin> {
    if (!ref.type || ref.type === "code") {
      const mapPair = resolvePlaygroundMapPair(this.#map, ref);
      if (!mapPair) return { ref, file: null };

      const [mapFile] = mapPair;

      if (this.#pin?.file?.path === mapFile.meta.path) {
        return {
          ref,
          file: this.#pin.file,
        };
      } else {
        const file = await this.#editor.readFile(mapFile.meta.path);
        return { ref, file };
      }
    } else {
      return { ref, file: null };
    }
  }

  async #onPin(message: PlaygroundMessage.ClientPin): Promise<void> {
    this.#pin = await this.#resolvePin(message.payload);
    await this.#savePin();

    this.#updateState();
    this.#sendState();
  }

  async #onUnpin(message: PlaygroundMessage.ClientUnpin): Promise<void> {
    this.#pin = null;
    await this.#savePin();

    this.#updateState();
    this.#sendState();
  }

  #savePin() {
    return this.#store.set("workspace", "playground.pin", this.#pin?.ref);
  }

  async #onNewDraft() {
    const promptId = buildMapPromptId();
    const prompt: PlaygroundMap.PromptDraft = {
      v: 1,
      type: "draft",
      id: promptId,
      content: "",
      vars: [],
      updatedAt: Date.now(),
    };

    this.#drafts[promptId] = prompt;
    this.#pin = { ref: { v: 1, type: "draft", promptId }, file: null };
    await Promise.all([this.#saveDrafts(), this.#savePin()]);

    this.#updateState();
    await this.#sendState();
  }

  async #onDraftUpdate(message: PlaygroundMessage.ClientDraftUpdate) {
    const { promptId, content } = message.payload;
    const draft = this.#drafts[promptId];
    always(draft);

    draft.content = content;
    draft.updatedAt = Date.now();
    await this.#saveDrafts();

    this.#updateState();
    await this.#sendState();
  }

  async #onDraftDelete(message: PlaygroundMessage.ClientDraftDelete) {
    const { promptId } = message.payload;
    const draft = this.#drafts[promptId];
    if (!draft) return;

    delete this.#drafts[promptId];

    if (
      this.#pin &&
      this.#pin.ref.type === "draft" &&
      this.#pin.ref.promptId === promptId
    ) {
      this.#pin = null;
      await this.#savePin();
    }

    await this.#saveDrafts();

    this.#updateState();
    await this.#sendState();
  }

  #saveDrafts() {
    return this.#store.set("workspace", "playground.drafts", this.#drafts);
  }
}
