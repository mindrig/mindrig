import { Span } from "@mindrig/types";
import { nanoid } from "nanoid";
import type { EditorFile } from "../editor/index.js";

export interface PlaygroundMap {
  files: Record<EditorFile.Path, PlaygroundMap.File>;
  updatedAt: number;
}

export namespace PlaygroundMap {
  export type FileId = string & { [fileIdBrand]: true };
  declare const fileIdBrand: unique symbol;

  export type PromptId = string & { [promptIdBrand]: true };
  declare const promptIdBrand: unique symbol;

  export interface File {
    id: FileId;
    updatedAt: number;
    prompts: readonly Prompt[];
    meta: EditorFile.Meta;
  }

  export interface Prompt {
    id: PromptId;
    content: string;
    updatedAt: number;
    span: Span;
  }

  export interface Matching {
    reason: MatchingReason;
    score: number;
  }

  export type MatchingReason = "content" | "distance" | "new";

  export type Pair = [File, Prompt];
}

export function buildPlaygroundMap(): PlaygroundMap {
  return { files: {}, updatedAt: Date.now() };
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
