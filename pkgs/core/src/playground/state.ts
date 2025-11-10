import type { EditorFile } from "../editor/index.js";
import { Versioned } from "../versioned/versioned.js";
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

  export interface Prompt {
    fileId: PlaygroundMap.FileId;
    prompt: PlaygroundMap.Prompt;
    reason: PromptReason;
  }

  export type PromptReason = "pinned" | "cursor";

  export type Ref = RefV1;

  export interface RefV1 extends Versioned<1> {
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

export namespace PlaygroundStatePromptToRef {
  export type Constraint = PlaygroundState.Prompt | null;

  export type Result<Prompt extends Constraint> = Prompt extends {}
    ? PlaygroundState.Ref
    : PlaygroundState.Ref | null;
}

export function playgroundStatePromptToRef<
  Prompt extends PlaygroundStatePromptToRef.Constraint,
>(statePrompt: Prompt): PlaygroundStatePromptToRef.Result<Prompt> {
  if (!statePrompt) return null as PlaygroundStatePromptToRef.Result<Prompt>;
  return {
    v: 1,
    promptId: statePrompt.prompt.id,
    fileId: statePrompt.fileId,
  };
}
