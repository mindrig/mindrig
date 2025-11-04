import { Prompt, PromptVar, Span, Span as TypesSpan } from "@mindrig/types";
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

  export type PromptVarId = string & { [promptVarIdBrand]: true };
  declare const promptVarIdBrand: unique symbol;

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
    vars: readonly PromptVar[];
    updatedAt: number;
    span: SpanV1;
  }

  export type PromptVar = PromptVarV1;

  export interface PromptVarV1 extends Versioned<1> {
    id: PromptVarId;
    exp: string;
    span: SpanV1;
  }

  export type Span = SpanV1;

  export interface SpanV1 extends Versioned<1>, TypesSpan {}

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

export function buildMapPromptVarId(): PlaygroundMap.PromptVarId {
  return `prompt-var-${nanoid()}` as PlaygroundMap.PromptVarId;
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
): PlaygroundMap.Span {
  return { v: 1, ...prompt.span.outer };
}

export function playgroundMapVarsFromPrompt(
  prompt: Prompt,
): PlaygroundMap.PromptVar[] {
  return prompt.vars.map((promptVar) =>
    playgroundMapVarFromPromptVar(promptVar, prompt.span.inner),
  );
}

export function playgroundMapVarFromPromptVar(
  promptVar: PromptVar,
  promptSpan: Span,
  id?: PlaygroundMap.PromptVarId,
): PlaygroundMap.PromptVar {
  const span: PlaygroundMap.Span = {
    v: 1,
    start: promptVar.span.outer.start - promptSpan.start,
    end: promptVar.span.outer.end - promptSpan.start,
  };

  return {
    v: 1,
    id: id || buildMapPromptVarId(),
    exp: promptVar.exp,
    span,
  };
}
