import type { EditorFile } from "../editor/index.js";
import { Versioned } from "../versioned/versioned.js";
import type { PlaygroundMap } from "./map.js";

export interface PlaygroundState {
  file: EditorFile.Meta | null;
  prompt: PlaygroundState.Prompt | null;
  prompts: PlaygroundState.PromptItem[];
  pin: PlaygroundState.Pin | null;
  parseError: string | null;
}

export namespace PlaygroundState {
  export interface PromptItem extends RefCode {
    /** Trimmed prompt content for display within the picker UI. */
    preview: string;
  }

  export type Prompt = PromptCode | PromptDraft;

  export interface PromptCode {
    type: "code";
    fileId: PlaygroundMap.FileId;
    prompt: PlaygroundMap.PromptCode;
    reason: PromptSourceReason;
  }

  export type PromptSourceReason = "pinned" | "cursor";

  export interface PromptDraft {
    type: "draft";
    prompt: PlaygroundMap.PromptDraft;
  }

  export type Ref = RefV1;

  export type RefV1 = RefCodeV1 | RefDraftV1;

  export type RefCode = RefCodeV1;

  export interface RefCodeV1 extends Versioned<1> {
    // TODO: Make it mandatory in v2
    type?: "code" | undefined;
    fileId: PlaygroundMap.FileId;
    promptId: PlaygroundMap.PromptId;
  }

  export type RefDraft = RefDraftV1;

  export interface RefDraftV1 extends Versioned<1> {
    type: "draft";
    promptId: PlaygroundMap.PromptId;
  }

  export type Pin = PinV1;

  export type PinV1 = RefV1;
}

export function buildPlaygroundState(): PlaygroundState {
  return {
    file: null,
    prompt: null,
    prompts: [],
    pin: null,
    parseError: null,
  };
}

export namespace PlaygroundStatePromptToRef {
  export type Constraint = PlaygroundState.PromptCode | null;

  export type Result<Prompt extends Constraint> = Prompt extends {}
    ? PlaygroundState.RefCode
    : PlaygroundState.RefCode | null;
}

export function playgroundStatePromptToCodeRef<
  Prompt extends PlaygroundStatePromptToRef.Constraint,
>(statePrompt: Prompt): PlaygroundStatePromptToRef.Result<Prompt> {
  if (!statePrompt) return null as PlaygroundStatePromptToRef.Result<Prompt>;
  return {
    v: 1,
    type: "code",
    promptId: statePrompt.prompt.id,
    fileId: statePrompt.fileId,
  };
}
