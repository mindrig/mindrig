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

  export interface Prompt extends Ref {
    content: string;
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
  export type Constraint = Pick<
    PlaygroundState.Prompt,
    "promptId" | "fileId"
  > | null;

  export type Result<Prompt extends Constraint> = Prompt extends {}
    ? PlaygroundState.Ref
    : PlaygroundState.Ref | null;
}

export function playgroundStatePromptToRef<
  Prompt extends PlaygroundStatePromptToRef.Constraint,
>(prompt: Prompt): PlaygroundStatePromptToRef.Result<Prompt> {
  if (!prompt) return null as PlaygroundStatePromptToRef.Result<Prompt>;
  return {
    v: 1,
    promptId: prompt.promptId,
    fileId: prompt.fileId,
  };
}
