import type { EditorFile } from "../editor/index.js";
import type { PlaygroundMap } from "./map.js";

export interface PlaygroundState {
  file: EditorFile.Meta | null;
  prompt: PlaygroundState.Prompt | null;
  prompts: PlaygroundState.PromptItem[];
  pin: PlaygroundState.Ref | null;
}

export namespace PlaygroundState {
  export interface PromptItem extends Ref {
    /** Trimmed prompt content for display within the picker UI. */
    preview: string;
  }

  export interface Prompt extends Ref {
    content: string;
    reason: PromptReason;
  }

  export type PromptReason = "pinned" | "cursor";

  export interface Ref {
    fileId: PlaygroundMap.FileId;
    promptId: PlaygroundMap.PromptId;
  }
}

export function isSamePlaygroundStateRef(
  left: PlaygroundState.Ref | null,
  right: PlaygroundState.Ref | null,
): boolean {
  if (!left || !right) return left === right;
  return left.fileId === right.fileId && left.promptId === right.promptId;
}

export function buildPlaygroundState(): PlaygroundState {
  return {
    file: null,
    prompt: null,
    prompts: [],
    pin: null,
  };
}
