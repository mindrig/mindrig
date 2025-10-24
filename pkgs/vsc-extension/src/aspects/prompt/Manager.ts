import { Manager } from "@/aspects/manager/Manager.js";
import { parsePrompts } from "@mindrig/parser-wasm";
import { Prompt } from "@mindrig/types";
import { EditorFile } from "@wrkspc/core/editor";
import {
  buildPromptParseResultFallback,
  PromptParse,
} from "@wrkspc/core/prompt";

export namespace PromptsManager {
  export interface Cache {
    path: string;
    content: string;
    prompts: Prompt[];
  }
}

export class PromptsManager extends Manager {
  #cache: PromptsManager.Cache | undefined;

  constructor(parent: Manager | null) {
    super(parent);
  }

  parse(file: EditorFile | null): PromptParse.Result {
    if (!file) return buildPromptParseResultFallback();

    if (this.#cache?.path === file.path && this.#cache.content === file.content)
      return {
        prompts: this.#cache.prompts,
        source: { type: "parse" },
      };

    const result = parsePrompts(file.content, file.path);

    if (result.state === "success") {
      this.#cache = {
        path: file.path,
        prompts: result.prompts,
        content: file.content,
      };

      return {
        prompts: result.prompts,
        source: { type: "parse" },
      };
    } else if (this.#cache?.path === file.path) {
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
}
