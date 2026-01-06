// import { Prompt, PromptVar, Span, Span as TypesSpan } from "@mindrig/types";
import {
  Prompt,
  PromptContentToken,
  PromptContentTokenJoint,
  PromptContentTokenStr,
  PromptContentTokenVar,
  PromptVar,
  Span,
  SpanShape,
} from "@volumen/types";
import { nanoid } from "nanoid";
import { compile as ttCompile } from "tuttut";
import type { EditorFile } from "../editor/index.js";
import { sliceSpan } from "../prompt/parse.js";
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
    prompts: ReadonlyArray<PromptCodeV1 | PromptCodeV2>;
    meta: EditorFile.MetaV1;
  }

  export type Prompt = PromptV1 | PromptV2;
  export type PromptLatest = PromptV2;

  export type PromptCode = PromptCodeV1 | PromptCodeV2;
  export type PromptCodeLatest = PromptCodeV2;

  export type PromptDraft = PromptDraftV1 | PromptDraftV2;
  export type PromptDraftLatest = PromptDraftV2;

  export type PromptVar = PromptVarV1 | PromptVarV2;
  export type PromptVarLatest = PromptVarV2;

  export type SpanShape = SpanShapeV1 | SpanShapeV2;
  export type SpanShapeLatest = SpanShapeV2;

  export type Span = SpanV1 | SpanV2;
  export type SpanLatest = SpanV2;

  //#region VAny

  export interface PromptBaseVAny {
    id: PromptId;
    updatedAt: number;
  }

  //#endregion

  //#region V1

  export type PromptV1 = PromptCodeV1 | PromptDraftV1;

  export interface PromptBaseV1 extends PromptBaseVAny {
    content: string;
    vars: readonly PromptVarV1[];
  }

  export interface PromptCodeV1 extends Versioned<1>, PromptBaseV1 {
    // TODO: Make it mandatory in v2
    type?: "code" | undefined;
    span: SpanShapeV1;
  }

  export interface PromptDraftV1 extends Versioned<1>, PromptBaseV1 {
    type: "draft";
  }

  export interface PromptVarV1 extends Versioned<1> {
    id: PromptVarId;
    exp: string;
    span: SpanShapeV1;
  }

  export interface SpanShapeV1 extends Versioned<1> {
    outer: SpanV1;
    inner: SpanV1;
  }

  export interface SpanV1 extends Versioned<1> {
    start: number;
    end: number;
  }

  //#endregion

  //#region V2

  // NOTE: The different between v1 and v2 is that v2 is adapted to use with
  // Volumen where variables aren't necessarily point to the position in
  // the prompt and can't be used for interpolation, e.g.:
  //   format!("Hello, {}", name)

  export type PromptV2 = PromptCodeV2 | PromptDraftV2;

  export interface PromptBaseV2 extends PromptBaseVAny {
    content: string;
    tokens: PromptContentTokenV2[];
    joint: PromptJointV2;
    vars: readonly PromptVarV2[];
  }

  export type PromptContentTokenV2 =
    | PromptContentTokenStrV2
    | PromptContentTokenVarV2
    | PromptContentTokenJointV2;

  export interface PromptContentTokenStrV2
    extends Versioned<2>,
      PromptContentTokenStr {
    content: string;
  }

  export interface PromptContentTokenVarV2
    extends Versioned<2>,
      PromptContentTokenVar {}

  export interface PromptContentTokenJointV2
    extends Versioned<2>,
      PromptContentTokenJoint {}

  export interface PromptCodeV2 extends Versioned<2>, PromptBaseV2 {
    type: "code";
    enclosure: SpanV2;
    span: SpanShapeV2;
  }

  export interface PromptDraftV2 extends Versioned<2>, PromptBaseV2 {
    type: "draft";
  }

  export interface PromptVarV2 extends Versioned<2> {
    id: PromptVarId;
    span: SpanShapeV2;
    content: ContentShapeV2;
  }

  export interface PromptJointV2 extends Versioned<2> {
    span: SpanShapeV2;
    content: string;
  }

  export type SpanV2 = [number, number];

  export interface SpanShapeV2 extends Versioned<2> {
    outer: SpanV2;
    inner: SpanV2;
  }

  export interface ContentShapeV2 extends Versioned<2> {
    outer: string;
    inner: string;
  }

  //#endregion

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

export namespace PlaygroundMapPromptFromParsed {
  export interface Props {
    source: string;
    prompt: Prompt;
    vars?: PlaygroundMap.PromptVar[];
    id?: PlaygroundMap.PromptId;
    timestamp?: number;
  }
}

export function toPlaygroundMapPrompt(
  props: PlaygroundMapPromptFromParsed.Props,
): PlaygroundMap.PromptCodeLatest {
  const { source, prompt, id, timestamp } = props;
  const span = playgroundMapSpanFromPrompt(prompt);
  const vars = normalizePlaygroundMapVars(
    source,
    props.vars || playgroundMapVarsFromPrompt(source, prompt),
  );
  const tokens = prompt.content.map((token) =>
    toPlaygroundMapPromptToken(source, vars, token),
  );

  const mapPrompt: PlaygroundMap.PromptCodeLatest = {
    v: 2,
    type: "code",
    id: id || buildMapPromptId(),
    enclosure: toPlaygroundMapSpan(prompt.enclosure),
    tokens,
    content: sliceSpan(source, prompt.span.outer),
    joint: {
      v: 2,
      span: toPlaygroundMapSpanShape(prompt.joint),
      content: sliceSpan(source, prompt.joint.inner),
    },
    span,
    vars,
    updatedAt: timestamp ?? Date.now(),
  };
  return mapPrompt;
}

export function toPlaygroundMapPromptToken(
  source: string,
  vars: PlaygroundMap.PromptVarV2[],
  token: PromptContentToken,
): PlaygroundMap.PromptContentTokenV2 {
  switch (token.type) {
    case "str": {
      const content = sliceSpan(source, token.span);
      return { v: 2, ...token, content };
    }

    case "var":
    case "joint":
      return { v: 2, ...token };
  }
}

export function normalizePlaygroundMapVars(
  source: string,
  vars: PlaygroundMap.PromptVar[],
): PlaygroundMap.PromptVarLatest[] {
  return vars.map((var_) => {
    if (var_.v === 2) return var_;

    const span: PlaygroundMap.SpanShapeV2 = {
      v: 2,
      outer: [var_.span.outer.start, var_.span.outer.end],
      inner: [var_.span.inner.start, var_.span.inner.end],
    };
    const content: PlaygroundMap.ContentShapeV2 = {
      v: 2,
      outer: sliceSpan(source, span.outer),
      inner: sliceSpan(source, span.inner),
    };

    return {
      v: 2,
      id: var_.id,
      span,
      content,
    };
  });
}

export function playgroundMapPairToEditorRef(
  pair: PlaygroundMap.Pair,
): EditorFile.Ref {
  const [start, end] = normalizePlaygroundMapSpan(pair[1].span.outer);
  return {
    path: pair[0].meta.path,
    selection: { start, end },
  };
}

export function normalizePlaygroundMapSpan(
  span: PlaygroundMap.Span,
): PlaygroundMap.SpanV2 {
  if (Array.isArray(span)) return span;
  return [span.start, span.end];
}

export function playgroundMapSpanFromPrompt(
  prompt: Prompt,
): PlaygroundMap.SpanShapeLatest {
  return {
    v: 2,
    outer: [...prompt.span.outer],
    inner: [...prompt.span.inner],
  };
}

export function playgroundMapVarsFromPrompt(
  source: string,
  prompt: Prompt,
): PlaygroundMap.PromptVarLatest[] {
  return prompt.vars.map((promptVar) => toPlaygroundMapVar(source, promptVar));
}

export function toPlaygroundMapVar(
  source: string,
  promptVar: PromptVar,
  id?: PlaygroundMap.PromptVarId,
): PlaygroundMap.PromptVarLatest {
  const span: PlaygroundMap.SpanShapeV2 = toPlaygroundMapSpanShape(
    promptVar.span,
  );

  const content: PlaygroundMap.ContentShapeV2 = {
    v: 2,
    outer: source.slice(promptVar.span.outer[0], promptVar.span.outer[1]),
    inner: source.slice(promptVar.span.inner[0], promptVar.span.inner[1]),
  };

  return {
    v: 2,
    id: id || buildMapPromptVarId(),
    content,
    span,
  };
}

export function toPlaygroundMapSpanShape(
  spanShape: SpanShape,
): PlaygroundMap.SpanShapeLatest {
  return {
    v: 2,
    outer: toPlaygroundMapSpan(spanShape.outer),
    inner: toPlaygroundMapSpan(spanShape.inner),
  };
}

export function toPlaygroundMapSpan(span: Span): PlaygroundMap.SpanLatest {
  const [start, end] = span;
  return [start, end];
}

export function getPlaygroundMapVarContent(
  var_: PlaygroundMap.PromptVar,
): string {
  if (!var_.v || var_.v === 1) return var_.exp;
  return var_.content.outer;
}

export function getPlaygroundMapVarExp(var_: PlaygroundMap.PromptVar): string {
  const inner =
    var_.v === 2
      ? var_.content.inner
      : var_.exp.slice(
          var_.span.inner.start - var_.span.outer.start,
          var_.exp.length - (var_.span.outer.end - var_.span.inner.end),
        );
  return inner.trim().toLowerCase();
}

export function compilePlaygroundMapPromptDraft(
  source: string,
): PlaygroundMap.PromptDraftV2 {
  const ttTokens = ttCompile(source);

  const vars: PlaygroundMap.PromptVarV2[] = [];
  const varsMap: Record<string, number> = {};

  const tokens: PlaygroundMap.PromptContentTokenV2[] = ttTokens.reduce<
    PlaygroundMap.PromptContentTokenV2[]
  >((acc, ttToken) => {
    switch (ttToken.type) {
      case "str":
        return acc.concat({
          v: 2,
          type: "str",
          span: ttToken.span,
          content: source.slice(ttToken.span[0], ttToken.span[1]),
        });

      case "var": {
        const content = source.slice(ttToken.span[0], ttToken.span[1]);
        const index = (varsMap[content] = varsMap[content] ?? vars.length);
        vars[index] = vars[index] || {
          v: 2,
          id: buildMapPromptVarId(),
          content: {
            v: 2,
            outer: content,
            inner: content.slice(2, -2),
          },
          span: {
            v: 2,
            outer: [ttToken.span[0], ttToken.span[1]],
            inner: [ttToken.span[0] + 2, ttToken.span[1] - 2], // exclude {{ }}
          },
        };
        return acc.concat({
          v: 2,
          type: "var",
          span: ttToken.span,
          index,
        });
      }
    }
  }, []);

  const prompt: PlaygroundMap.PromptDraftV2 = {
    v: 2,
    type: "draft",
    id: buildMapPromptId(),
    content: source,
    tokens,
    joint: buildEmptyPlaygroundMapJoint(),
    updatedAt: Date.now(),
    vars,
  };
  return prompt;
}

export function buildEmptyPlaygroundMapJoint(): PlaygroundMap.PromptJointV2 {
  return {
    v: 2,
    content: "",
    span: { v: 2, outer: [0, 0], inner: [0, 0] },
  };
}
