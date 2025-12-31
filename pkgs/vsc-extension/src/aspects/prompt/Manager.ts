import { Manager } from "@/aspects/manager/Manager.js";
import { Prompt } from "@volumen/types";
import { EditorFile } from "@wrkspc/core/editor";
import {
  buildPromptParseResultFallback,
  PromptParse,
} from "@wrkspc/core/prompt";
import { log } from "smollog";
import { parsePrompts } from "volumen";

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

    if (
      this.#cache?.path === file.path &&
      this.#cache.content === file.content
    ) {
      log.debug(`Using cached prompts for ${file.path}`, this.#cache);

      return {
        prompts: this.#cache.prompts,
        source: { type: "parse" },
      };
    }

    log.debug(`Parsing prompts in ${file.path}`, file.content);
    const result = parsePrompts(file.content, file.path);

    if (result.state === "success") {
      log.debug(
        `Parsed ${result.prompts.length} prompts in ${file.path}`,
        result,
      );

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
      log.debug(
        `Using cached prompts for ${file.path} due to parse error: ${result.error}`,
        result,
      );

      return {
        prompts: this.#cache.prompts,
        source: {
          type: "cache",
          reason: { type: "invalid", error: result.error },
        },
      };
    } else {
      log.warn(
        `Failed to parse prompts in ${file.path}: ${result.error}`,
        result,
      );

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
