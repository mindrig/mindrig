import { Prompt, PromptVar, Span, SpanShape } from "@mindrig/types";
import { EditorFile, editorFileToMeta } from "@wrkspc/core/editor";
import {
  buildMapFileId,
  buildMapPromptId,
  buildMapPromptVarId,
  PlaygroundMap,
  playgroundMapSpanFromPrompt,
  playgroundMapVarsFromPrompt,
} from "@wrkspc/core/playground";
import { nanoid } from "nanoid";
import { ResolvePlaygroundState } from "../resolve";

export const DEFAULT_TIMESTAMP = 1_700_000_000_000;
export const DEFAULT_FILE_PATH_NEW = "/new.ts" as EditorFile.Path;
export const DEFAULT_FILE_PATH_OLD = "/old.ts" as EditorFile.Path;
export const DEFAULT_PROMPT = "Say hello to {{name}}";
export const DEFAULT_PROMPT_START = 50;
export const DEFAULT_SPAN: Span = {
  start: DEFAULT_PROMPT_START,
  end: DEFAULT_PROMPT_START + DEFAULT_PROMPT.length,
};

export function editorFilePathFactory(
  path?: string | undefined,
): EditorFile.Path {
  return (path || `/file-${nanoid()}.ts`) as EditorFile.Path;
}

export function parsedPromptFactory(overrides?: Partial<Prompt>): Prompt {
  return {
    file: editorFilePathFactory(),
    exp: DEFAULT_PROMPT,
    vars: [],
    span: parsedPromptSpanShapeFactory(),
    ...overrides,
  };
}

export function parsedPromptVarFactory(
  overrides?: Partial<PromptVar>,
): PromptVar {
  return {
    exp: "${name}",
    span: {
      outer: { start: 60, end: 80 },
      inner: { start: 60, end: 80 },
    },
    ...overrides,
  };
}

export function parsedPromptSpanShapeFactory(
  overrides?: Partial<SpanShape>,
): Prompt["span"] {
  return {
    outer: DEFAULT_SPAN,
    inner: DEFAULT_SPAN,
    ...overrides,
  };
}

export function playgroundMapFileFactory(
  overrides?: Partial<PlaygroundMap.File>,
): PlaygroundMap.File {
  return {
    v: 1,
    id: buildMapFileId(),
    prompts: [playgroundMapPromptFactory()],
    updatedAt: Date.now(),
    meta: editorFileMetaFactory(),
    ...overrides,
  };
}

export function playgroundMapPromptFactory(
  overrides?: Partial<PlaygroundMap.PromptCode>,
): PlaygroundMap.PromptCode {
  return {
    v: 1,
    type: "code",
    id: buildMapPromptId(),
    content: DEFAULT_PROMPT,
    span: {
      v: 1,
      outer: { v: 1, start: 0, end: 0 },
      inner: { v: 1, start: 0, end: 0 },
    },
    updatedAt: Date.now(),
    vars: [playgroundMapVarFactory()],
    ...overrides,
  };
}

export function playgroundMapPromptDraftFactory(
  overrides?: Partial<PlaygroundMap.PromptDraft>,
): PlaygroundMap.PromptDraft {
  return {
    v: 1,
    type: "draft",
    id: buildMapPromptId(),
    content: DEFAULT_PROMPT,
    updatedAt: Date.now(),
    vars: [playgroundMapVarFactory()],
    ...overrides,
  };
}

export function playgroundMapVarFactory(
  overrides?: Partial<PlaygroundMap.PromptVar>,
): PlaygroundMap.PromptVar {
  return {
    v: 1,
    id: buildMapPromptVarId(),
    exp: "${name}",
    span: {
      v: 1,
      outer: { v: 1, start: 0, end: 0 },
      inner: { v: 1, start: 0, end: 0 },
    },
    ...overrides,
  };
}

export function playgroundMapPromptFromParsedFactory(
  parsedPrompt: Prompt,
): PlaygroundMap.PromptCode {
  return {
    v: 1,
    type: "code",
    id: buildMapPromptId(),
    content: parsedPrompt.exp,
    vars: playgroundMapVarsFromPrompt(parsedPrompt),
    span: playgroundMapSpanFromPrompt(parsedPrompt),
    updatedAt: Date.now(),
  };
}

export namespace PlaygroundStateSetupFactory {
  export interface Props {
    cursorA?: EditorFile.Cursor | undefined;
    cursorB?: EditorFile.Cursor | undefined;
    expAlpha?: string;
    expBeta?: string;
    expGamma?: string;
  }

  export type Result = ReturnType<typeof playgroundSetupFactory>;
}

export function playgroundSetupFactory(
  props: PlaygroundStateSetupFactory.Props = {},
) {
  //#region File A

  const cursorA =
    "cursorA" in props ? props.cursorA : editorCursorFactory({ offset: 100 });
  const editorFileA = editorFileFactory({
    cursor: cursorA,
  });

  const spanAlpha = { start: 0, end: 5 };
  const parsedPromptAlpha = parsedPromptFactory({
    file: editorFileA.path,
    exp: props.expAlpha ?? "alpha",
    vars: [parsedPromptVarFactory({ exp: "${one}" })],
    span: parsedPromptSpanShapeFactory({ outer: spanAlpha }),
  });
  const mapPromptAlpha =
    playgroundMapPromptFromParsedFactory(parsedPromptAlpha);

  const spanBeta = { start: 6, end: 15 };
  const parsedPromptBeta = parsedPromptFactory({
    file: editorFileA.path,
    exp: props.expBeta ?? "beta",
    vars: [
      parsedPromptVarFactory({ exp: "${two}" }),
      parsedPromptVarFactory({ exp: "${one}" }),
    ],
    span: parsedPromptSpanShapeFactory({ outer: spanBeta }),
  });
  const mapPromptBeta = playgroundMapPromptFromParsedFactory(parsedPromptBeta);

  const parsedPromptsA = [parsedPromptAlpha, parsedPromptBeta] as const;
  const mapPromptsA = [mapPromptAlpha, mapPromptBeta] as const;

  const mapFileA = playgroundMapFileFactory({
    meta: editorFileToMeta(editorFileA),
    prompts: mapPromptsA,
  });

  //#endregion

  //#region File B

  const cursorB =
    "cursorB" in props ? props.cursorB : editorCursorFactory({ offset: 100 });
  const editorFileB = editorFileFactory({ cursor: cursorB });

  const spanGamma = { ...spanBeta };
  const parsedPromptGamma = parsedPromptFactory({
    file: editorFileB.path,
    exp: props.expGamma ?? "gamma",
    vars: [
      parsedPromptVarFactory({ exp: "${three}" }),
      parsedPromptVarFactory({ exp: "${four}" }),
    ],
    span: parsedPromptSpanShapeFactory({ outer: spanGamma }),
  });
  const mapPromptGamma =
    playgroundMapPromptFromParsedFactory(parsedPromptGamma);

  const parsedPromptsB = [parsedPromptGamma] as const;
  const mapPromptsB = [mapPromptGamma] as const;

  const mapFileB = playgroundMapFileFactory({
    meta: editorFileToMeta(editorFileB),
    prompts: mapPromptsB,
  });

  //#endregion

  const map = playgroundMapFactory({
    files: {
      [editorFileA.path]: mapFileA,
      [editorFileB.path]: mapFileB,
    },
  });

  const pin = null;
  const timestamp = Date.now();
  const playgroundStateProps: ResolvePlaygroundState.Props = {
    timestamp,
    map,
    drafts: {},
    editorFile: editorFileA,
    currentFile: editorFileA,
    parsedPrompts: parsedPromptsA,
    pin,
    parseError: null,
  };

  const parsedPrompts = [...parsedPromptsA, ...parsedPromptsB] as const;
  const mapPrompts = [...mapPromptsA, ...mapPromptsB] as const;

  return {
    timestamp,
    cursorA,
    editorFileA,
    parsedPromptsA,
    mapPromptsA,
    mapFileA,
    cursorB,
    editorFileB,
    parsedPromptsB,
    mapPromptsB,
    mapFileB,
    map,
    pin,
    parsedPrompts,
    mapPrompts,
    playgroundStateProps,
  };
}

export function playgroundMapFactory(
  overrides?: Partial<PlaygroundMap>,
): PlaygroundMap {
  let files = overrides?.files;
  if (!files) {
    const file = editorFileFactory();
    const mapPrompt = playgroundMapPromptFactory();
    const mapFile = playgroundMapFileFactory({
      prompts: [mapPrompt],
      meta: {
        v: 1,
        path: file.path,
        languageId: file.languageId,
        isDirty: file.isDirty,
      },
    });
    files = { [file.path]: mapFile };
  }

  return {
    v: 1,
    files,
    updatedAt: Date.now(),
    ...overrides,
  };
}

export function editorFileFactory(overrides?: Partial<EditorFile>): EditorFile {
  return {
    content: "",
    ...editorFileMetaFactory(overrides),
    ...overrides,
  };
}

export function editorFileMetaFactory(
  overrides?: Partial<EditorFile.Meta>,
): EditorFile.Meta {
  return {
    v: 1,
    path: editorFilePathFactory(),
    isDirty: false,
    languageId: "ts",
    ...overrides,
  };
}

export function editorCursorFactory(
  overrides?: Partial<EditorFile.Cursor>,
): EditorFile.Cursor {
  return {
    offset: 0,
    line: 0,
    character: 0,
    ...overrides,
  };
}
