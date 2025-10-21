import type { EditorFile } from "../editor/index.js";
import type { PlaygroundMap } from "./map.js";

export interface PlaygroundState {
  file: EditorFile.Meta | null;
  prompt: PlaygroundState.Prompt | null;
  prompts: PlaygroundState.PromptItem[];
  pin: PlaygroundState.Ref | null;
}

export namespace PlaygroundState {
  export interface PromptItem {
    fileId: EditorFile.Path;
    promptId: PlaygroundMap.PromptId;
    /**
     * Trimmed prompt content for display within the picker UI.
     */
    preview: string;
  }

  export interface Prompt {
    fileId: EditorFile.Path;
    promptId: PlaygroundMap.PromptId;
    content: string;
    reason: PromptReason;
  }

  export type PromptReason = "pinned" | "cursor";

  export interface Ref {
    fileId: EditorFile.Path;
    promptId: PlaygroundMap.PromptId;
  }
}
