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
    prompts: readonly PromptV1Code[];
    meta: EditorFile.MetaV1;
  }

  export type Prompt = PromptV1;

  export type PromptV1 = PromptV1Code | PromptV1Draft;

  export interface PromptBase {
    id: PromptId;
    content: string;
    vars: readonly PromptVarV1[];
    updatedAt: number;
  }

  export type PromptCode = PromptV1Code;

  export interface PromptV1Code extends Versioned<1>, PromptBase {
    // TODO: Make it mandatory in v2
    type?: "code" | undefined;
    span: SpanShapeV1;
  }

  export type PromptDraft = PromptV1Draft;

  export interface PromptV1Draft extends Versioned<1>, PromptBase {
    type: "draft";
  }

  export type PromptVar = PromptVarV1;

  export interface PromptVarV1 extends Versioned<1> {
    id: PromptVarId;
    exp: string;
    span: SpanShapeV1;
  }

  export type SpanShape = SpanShapeV1;

  export interface SpanShapeV1 extends Versioned<1> {
    outer: Span;
    inner: Span;
  }

  export type Span = SpanV1;

  export interface SpanV1 extends Versioned<1>, TypesSpan {}

  export interface Matching {
    reason: MatchingReason;
    score: number;
  }

  export type MatchingReason = "content" | "distance" | "new";

  export type Pair = [File, PromptCode];
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
    selection: pair[1].span.outer,
  };
}

export function playgroundMapSpanFromPrompt(
  prompt: Prompt,
): PlaygroundMap.SpanShape {
  return {
    v: 1,
    outer: { v: 1, ...prompt.span.outer },
    inner: { v: 1, ...prompt.span.inner },
  };
}

export function playgroundMapVarsFromPrompt(
  prompt: Prompt,
): PlaygroundMap.PromptVar[] {
  return prompt.vars.map((promptVar) =>
    playgroundMapVarFromPromptVar(promptVar, prompt.span.outer),
  );
}

export function playgroundMapVarFromPromptVar(
  promptVar: PromptVar,
  promptSpan: Span,
  id?: PlaygroundMap.PromptVarId,
): PlaygroundMap.PromptVar {
  const span: PlaygroundMap.SpanShapeV1 = {
    v: 1,
    outer: {
      v: 1,
      start: promptVar.span.outer.start - promptSpan.start,
      end: promptVar.span.outer.end - promptSpan.start,
    },
    inner: {
      v: 1,
      start: promptVar.span.inner.start - promptSpan.start,
      end: promptVar.span.inner.end - promptSpan.start,
    },
  };

  return {
    v: 1,
    id: id || buildMapPromptVarId(),
    exp: promptVar.exp,
    span,
  };
}
