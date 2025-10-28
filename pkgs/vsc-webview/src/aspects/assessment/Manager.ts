import { PlaygroundMap, PlaygroundState } from "@wrkspc/core/playground";
import { useMemo } from "react";

export namespace AssessmentManager {}

export class AssessmentManager {
  static use(prompt: PlaygroundState.Prompt) {
    const manager = useMemo(
      () => new AssessmentManager(prompt.promptId),
      [prompt.promptId],
    );
    return manager;
  }

  #promptId;

  constructor(promptId: PlaygroundMap.PromptId) {
    this.#promptId = promptId;
  }
}
