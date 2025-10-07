import { Manager } from "@/aspects/manager/Manager.js";
import { parsePrompts } from "@mindrig/parser-wasm";
import { Prompt } from "@mindrig/types";
import { EditorFile } from "@wrkspc/core/editor";
import { VscMessagePrompt } from "@wrkspc/core/message";
import { PromptParse } from "@wrkspc/core/prompt";
import { EditorManager } from "../editor/Manager";
import { MessagesManager } from "../message/Manager";

export namespace PromptsManager {
  export interface Props {
    messages: MessagesManager;
    editor: EditorManager;
  }

  export interface Cache {
    path: string;
    prompts: Prompt[];
  }
}

export class PromptsManager extends Manager {
  #messages: MessagesManager;
  #editor: EditorManager;
  #cache: PromptsManager.Cache | undefined;

  constructor(parent: Manager, props: PromptsManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#editor = props.editor;

    this.#editor.on(this, "active-change", this.#onUpdate);

    this.#editor.on(this, "file-update", this.#onUpdate);

    // Webview messages

    this.#messages.listen(this, "prompt-wv-reveal", this.#onReveal);
  }

  get state(): PromptParse.Result {
    return this.#parse();
  }

  #parse(fileState?: EditorFile | undefined | null): PromptParse.Result {
    // Use editor state if no file provided
    if (fileState === undefined) fileState = this.#editor.activeFile;

    if (!fileState)
      return {
        prompts: [],
        source: {
          type: "fallback",
          reason: { type: "unsupported" },
        },
      };

    const result = parsePrompts(fileState.content, fileState.path);

    if (result.state === "success") {
      this.#cache = {
        path: fileState.path,
        prompts: result.prompts,
      };

      return {
        prompts: result.prompts,
        source: { type: "parse" },
      };
    } else if (this.#cache?.path === fileState.path) {
      return {
        prompts: this.#cache.prompts,
        source: {
          type: "cache",
          reason: { type: "invalid", error: result.error },
        },
      };
    } else {
      return {
        prompts: [],
        source: {
          type: "fallback",
          reason: { type: "invalid", error: result.error },
        },
      };
    }
  }

  #onUpdate(fileState: EditorFile | null) {
    const result = this.#parse(fileState);
    return this.#messages.send({
      type: "prompt-ext-update",
      payload: result,
    });
  }

  #onReveal(message: VscMessagePrompt.WvReveal) {
    return this.#editor.openFile(message.payload);
  }
}
