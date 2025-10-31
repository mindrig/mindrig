import { Prompt, Span } from "@mindrig/types";
import { nanoid } from "nanoid";
import type { EditorFile } from "../editor/index.js";
import { Versioned } from "../versioned/versioned.js";

export type PlaygroundMap = PlaygroundMap.V1;

export namespace PlaygroundMap {
  //#region V1

  export interface V1 extends Versioned<1> {
    files: Record<EditorFile.Path, PlaygroundMap.File>;
    updatedAt: number;
  }

  //#endregion

  export type FileId = string & { [fileIdBrand]: true };
  declare const fileIdBrand: unique symbol;

  export type PromptId = string & { [promptIdBrand]: true };
  declare const promptIdBrand: unique symbol;

  export type File = FileV1;

  export interface FileV1 extends Versioned<1> {
    id: FileId;
    updatedAt: number;
    prompts: readonly PromptV1[];
    meta: EditorFile.MetaV1;
  }

  export type Prompt = PromptV1;

  export interface PromptV1 extends Versioned<1> {
    id: PromptId;
    content: string;
    updatedAt: number;
    span: PromptSpanV1;
  }

  export type PromptSpan = PromptSpanV1;

  export interface PromptSpanV1 extends Versioned<1>, Span {}

  export interface Matching {
    reason: MatchingReason;
    score: number;
  }

  export type MatchingReason = "content" | "distance" | "new";

  export type Pair = [File, Prompt];
}

export function buildPlaygroundMap(): PlaygroundMap {
  return { v: 1, files: {}, updatedAt: Date.now() };
}

export function buildMapFileId(): PlaygroundMap.FileId {
  return `file-${nanoid()}` as PlaygroundMap.FileId;
}

export function buildMapPromptId(): PlaygroundMap.PromptId {
  return `prompt-${nanoid()}` as PlaygroundMap.PromptId;
}

export function playgroundMapPairToEditorRef(
  pair: PlaygroundMap.Pair,
): EditorFile.Ref {
  return {
    path: pair[0].meta.path,
    selection: pair[1].span,
  };
}

export function playgroundMapSpanFromPrompt(
  prompt: Prompt,
): PlaygroundMap.PromptSpan {
  return { v: 1, ...prompt.span.outer };
}
