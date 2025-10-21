import { describe, expect, it } from "vitest";
import { EditorFile } from "@wrkspc/core/editor";
import type { PlaygroundMap, PlaygroundState } from "@wrkspc/core/playground";
import type { Prompt } from "@mindrig/types";
import type { Language } from "@wrkspc/core/lang";
import {
  calcMatchingPromptsScore,
  matchPlaygroundMapFile,
  matchPlaygroundMapFileByDistance,
  matchPlaygroundMapPrompts,
  matchPlaygroundMapPromptsByContent,
  matchPlaygroundMapPromptsByDistance,
  resolveFilePromptsMap,
  resolvePlaygroundState,
} from "./resolve";

const TIMESTAMP = 1_700_000_000_000;
const LANGUAGE_ID = "ts" as Language.Id;

function parsedPrompt(
  exp: string,
  start = 0,
  end = exp.length,
  file = "/workspace/file.ts",
): Prompt {
  return {
    file,
    exp,
    vars: [],
    span: {
      outer: { start, end },
      inner: { start, end },
    },
  };
}

function mapPrompt(
  id: string,
  content: string,
  updatedAt = TIMESTAMP - 100,
): PlaygroundMap.Prompt {
  return {
    id: id as PlaygroundMap.PromptId,
    content,
    updatedAt,
  };
}

function mapFile(
  path: EditorFile.Path,
  prompts: PlaygroundMap.Prompt[],
  updatedAt = TIMESTAMP - 100,
): PlaygroundMap.File {
  return {
    id: `file-${path}` as PlaygroundMap.FileId,
    path,
    prompts,
    updatedAt,
  };
}

function playgroundMap(
  entries: Array<{ path: string; prompts: PlaygroundMap.Prompt[] }>,
  updatedAt = TIMESTAMP - 100,
): PlaygroundMap {
  const files: PlaygroundMap["files"] = {};
  for (const entry of entries) {
    const path = EditorFile.path(entry.path);
    files[path] = mapFile(path, entry.prompts, updatedAt);
  }
  return {
    files,
    updatedAt,
  };
}

function editorFile(
  path: string,
  opts: { cursorOffset?: number; isDirty?: boolean } = {},
): EditorFile {
  const { cursorOffset, isDirty = false } = opts;
  return {
    path: EditorFile.path(path),
    content: "",
    isDirty,
    lastSaved: isDirty ? undefined : new Date(TIMESTAMP - 50),
    languageId: LANGUAGE_ID,
    cursor:
      typeof cursorOffset === "number"
        ? { offset: cursorOffset, line: 0, character: cursorOffset }
        : undefined,
  };
}

describe("matchPlaygroundMapPromptsByContent", () => {
  it("matches prompts with identical normalized content", () => {
    const mapPrompts = [
      mapPrompt("prompt-1", "say hello"),
      mapPrompt("prompt-2", "trim whitespace"),
    ];
    const parsedPrompts = [
      parsedPrompt(" say hello  "),
      parsedPrompt("trim   whitespace"),
    ];

    const result = matchPlaygroundMapPromptsByContent({
      unmatchedMapPrompts: new Set(mapPrompts),
      unmatchedParsedPrompts: new Set(parsedPrompts),
    });

    expect(result.matchedMapPrompts).toHaveLength(2);
    expect(result.unmatchedMapPrompts.size).toBe(0);
    expect(result.unmatchedParsedPrompts.size).toBe(0);
  });
});

describe("matchPlaygroundMapPromptsByDistance", () => {
  it("matches prompts within Levenshtein threshold", () => {
    const mapPrompts = [
      mapPrompt("prompt-1", "return 42;"),
      mapPrompt("prompt-2", "const value = 10;"),
    ];
    const parsedPrompts = [
      parsedPrompt("return 42"),
      parsedPrompt("export function unrelated() {}"),
    ];

    const result = matchPlaygroundMapPromptsByDistance({
      unmatchedMapPrompts: new Set(mapPrompts),
      unmatchedParsedPrompts: new Set(parsedPrompts),
    });

    expect(result.matchedMapPrompts).toHaveLength(1);
    expect(result.unmatchedMapPrompts.size).toBe(1);
    expect(result.unmatchedParsedPrompts.size).toBe(1);
  });
});

describe("matchPlaygroundMapPrompts", () => {
  it("preserves matched prompt ids and inserts new prompts in parsed order", () => {
    const mapPrompts = [
      mapPrompt("prompt-keep-1", "alpha"),
      mapPrompt("prompt-keep-2", "beta"),
    ];
    const parsedPrompts = [
      parsedPrompt("gamma", 0, 5),
      parsedPrompt("alpha", 6, 11),
      parsedPrompt("beta", 12, 17),
    ];

    const result = matchPlaygroundMapPrompts({
      mapPrompts,
      parsedPrompts,
    });

    const nextPrompts = result.nextPrompts;
    const firstMapPrompt = mapPrompts[0]!;
    const secondMapPrompt = mapPrompts[1]!;
    expect(nextPrompts.length).toBe(3);

    const newPrompt = nextPrompts[0]!;
    const keepAlpha = nextPrompts[1]!;
    const keepBeta = nextPrompts[2]!;

    expect(keepAlpha.id).toBe(firstMapPrompt.id);
    expect(keepBeta.id).toBe(secondMapPrompt.id);
    expect(newPrompt.id).not.toBe(firstMapPrompt.id);
    expect(result.unmatchedParsedPrompts.size).toBe(1);
    expect(result.unmatchedMapPrompts.size).toBe(0);
  });
});

describe("calcMatchingPromptsScore", () => {
  it("returns ratio of matched prompts", () => {
    const score = calcMatchingPromptsScore({
      matchedMapPrompts: [
        mapPrompt("prompt-1", "alpha"),
        mapPrompt("prompt-2", "beta"),
      ],
      unmatchedMapPrompts: new Set([mapPrompt("prompt-3", "gamma")]),
      unmatchedParsedPrompts: new Set([parsedPrompt("delta")]),
    });

    expect(score).toBeCloseTo(0.5);
  });
});

describe("matchPlaygroundMapFile", () => {
  it("returns file when path matches the map entry", () => {
    const path = EditorFile.path("/workspace/file.ts");
    const map = playgroundMap([
      {
        path: "/workspace/file.ts",
        prompts: [mapPrompt("prompt-keep", "alpha")],
      },
    ]);

    const match = matchPlaygroundMapFile({
      timestamp: TIMESTAMP,
      map,
      file: editorFile("/workspace/file.ts"),
      parsedPrompts: [parsedPrompt("alpha")],
    });

    expect(match?.path).toBe(path);
  });

  it("falls back to distance matching when path differs", () => {
    const map = playgroundMap([
      {
        path: "/workspace/old.ts",
        prompts: [mapPrompt("prompt-keep", "alpha")],
      },
    ]);

    const match = matchPlaygroundMapFile({
      timestamp: TIMESTAMP,
      map,
      file: editorFile("/workspace/new.ts"),
      parsedPrompts: [parsedPrompt("alpha")],
    });

    expect(match?.path).toBe(EditorFile.path("/workspace/old.ts"));
  });
});

describe("matchPlaygroundMapFileByDistance", () => {
  it("returns best scoring file above threshold", () => {
    const map = playgroundMap([
      { path: "/workspace/one.ts", prompts: [mapPrompt("prompt-a", "hello")] },
      { path: "/workspace/two.ts", prompts: [mapPrompt("prompt-b", "world")] },
    ]);

    const match = matchPlaygroundMapFileByDistance({
      map,
      parsedPrompts: [parsedPrompt("world")],
    });

    expect(match?.path).toBe(EditorFile.path("/workspace/two.ts"));
  });
});

describe("resolveFilePromptsMap", () => {
  it("creates new map entry for unseen files", () => {
    const map = playgroundMap([]);
    const file = editorFile("/workspace/new.ts");
    const parsedPrompts = [parsedPrompt("alpha"), parsedPrompt("beta")];

    const result = resolveFilePromptsMap({
      timestamp: TIMESTAMP,
      map,
      file,
      parsedPrompts,
    });

    const nextFile = result.files[file.path];
    expect(nextFile).toBeDefined();
    expect(nextFile?.prompts).toHaveLength(2);
    expect(result.updatedAt).toBe(TIMESTAMP);
  });

  it("updates prompt content while preserving ids", () => {
    const path = EditorFile.path("/workspace/file.ts");
    const existingPrompt = mapPrompt("prompt-keep", "alpha", TIMESTAMP - 200);
    const map = playgroundMap(
      [{ path: "/workspace/file.ts", prompts: [existingPrompt] }],
      TIMESTAMP - 200,
    );
    const file = editorFile("/workspace/file.ts");
    const parsedPrompts = [parsedPrompt("alpha edited")];

    const result = resolveFilePromptsMap({
      timestamp: TIMESTAMP,
      map,
      file,
      parsedPrompts,
    });

    const nextFile = result.files[path]!;
    expect(nextFile.prompts.length).toBe(1);
    const nextPrompt = nextFile.prompts[0]!;
    expect(nextPrompt.id).toBe(existingPrompt.id);
    expect(nextPrompt.content).toBe("alpha edited");
    expect(nextPrompt.updatedAt).toBe(TIMESTAMP);
    expect(result.updatedAt).toBe(TIMESTAMP);
  });

  it("returns original map when nothing changed", () => {
    const path = EditorFile.path("/workspace/file.ts");
    const existingPrompt = mapPrompt("prompt-keep", "alpha", TIMESTAMP - 200);
    const map = playgroundMap(
      [{ path: "/workspace/file.ts", prompts: [existingPrompt] }],
      TIMESTAMP - 200,
    );

    const result = resolveFilePromptsMap({
      timestamp: TIMESTAMP,
      map,
      file: editorFile("/workspace/file.ts"),
      parsedPrompts: [parsedPrompt("alpha")],
    });

    expect(result).toBe(map);
  });

  it("re-keys matched file when the path changes", () => {
    const oldPath = EditorFile.path("/workspace/old.ts");
    const map = playgroundMap([
      {
        path: "/workspace/old.ts",
        prompts: [mapPrompt("prompt-keep", "alpha")],
      },
    ]);

    const result = resolveFilePromptsMap({
      timestamp: TIMESTAMP,
      map,
      file: editorFile("/workspace/new.ts"),
      parsedPrompts: [parsedPrompt("alpha")],
    });

    const relocatedFile = result.files[EditorFile.path("/workspace/new.ts")];
    expect(relocatedFile).toBeDefined();
    expect(result.files[oldPath]).toBeUndefined();
  });
});

describe("resolvePlaygroundState", () => {
  it("returns pinned prompt when reference exists", () => {
    const path = EditorFile.path("/workspace/file.ts");
    const prompt = mapPrompt("prompt-pin", "alpha");
    const map = playgroundMap([
      { path: "/workspace/file.ts", prompts: [prompt] },
    ]);
    const pin: PlaygroundState.Ref = { fileId: path, promptId: prompt.id };

    const state = resolvePlaygroundState({
      timestamp: TIMESTAMP,
      map,
      file: editorFile("/workspace/file.ts"),
      parsedPrompts: [parsedPrompt("alpha")],
      pin,
    });

    expect(state.prompt?.reason).toBe("pinned");
    expect(state.pin).toEqual(pin);
  });

  it("selects prompt under cursor when not pinned", () => {
    const path = EditorFile.path("/workspace/file.ts");
    const prompts = [
      mapPrompt("prompt-1", "alpha"),
      mapPrompt("prompt-2", "beta"),
    ];
    const map = playgroundMap([{ path: "/workspace/file.ts", prompts }]);
    const parsedPrompts = [
      parsedPrompt("alpha", 0, 5),
      parsedPrompt("beta", 6, 15),
    ];

    const state = resolvePlaygroundState({
      timestamp: TIMESTAMP,
      map,
      file: editorFile("/workspace/file.ts", { cursorOffset: 8 }),
      parsedPrompts,
      pin: null,
    });

    const secondPrompt = prompts[1]!;

    expect(state.prompt?.promptId).toBe(secondPrompt.id);
    expect(state.prompt?.reason).toBe("cursor");
    expect(state.pin).toBeNull();
  });

  it("sanitizes invalid pin references", () => {
    const map = playgroundMap([{ path: "/workspace/file.ts", prompts: [] }]);
    const pin: PlaygroundState.Ref = {
      fileId: EditorFile.path("/workspace/file.ts"),
      promptId: "missing" as PlaygroundMap.PromptId,
    };

    const state = resolvePlaygroundState({
      timestamp: TIMESTAMP,
      map,
      file: editorFile("/workspace/file.ts"),
      parsedPrompts: [],
      pin,
    });

    expect(state.pin).toBeNull();
    expect(state.prompt).toBeNull();
  });
});
