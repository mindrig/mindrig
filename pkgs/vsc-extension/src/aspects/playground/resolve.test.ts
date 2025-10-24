import { editorFileToMeta } from "@wrkspc/core/editor";
import {
  type PlaygroundMap,
  type PlaygroundState,
} from "@wrkspc/core/playground";
import { describe, expect, it } from "vitest";
import {
  editorCursorFactory,
  editorFileFactory,
  editorFileMetaFactory,
  editorFilePathFactory,
  parsedPromptFactory,
  playgroundMapFactory,
  playgroundMapFileFactory,
  playgroundMapPromptFactory,
  playgroundSetupFactory,
} from "./__tests__/factories";
import {
  calcMatchedPromptsScore,
  matchPlaygroundMapFile,
  matchPlaygroundMapFileByDistance,
  matchPlaygroundMapPrompts,
  matchPlaygroundMapPromptsByContent,
  matchPlaygroundMapPromptsByDistance,
  resolvePlaygroundMap,
  resolvePlaygroundMapFile,
  resolvePlaygroundMapPair,
  resolvePlaygroundState,
} from "./resolve";

//#region State

describe(resolvePlaygroundState, () => {
  describe("file", () => {
    it("resolves active file state", () => {
      const { playgroundStateProps, editorFileA, mapFileA, mapPromptsA } =
        playgroundSetupFactory();
      const state = resolvePlaygroundState(playgroundStateProps);
      expect(state).toMatchObject({
        file: {
          isDirty: editorFileA.isDirty,
          languageId: editorFileA.languageId,
          path: editorFileA.path,
        },
        prompt: null,
        pin: null,
        prompts: [
          expect.objectContaining({
            fileId: mapFileA.id,
            promptId: mapPromptsA[0].id,
          }),
          expect.objectContaining({
            fileId: mapFileA.id,
            promptId: mapPromptsA[1].id,
          }),
        ],
      });
    });

    it("resolves empty state when active file is not defined", () => {
      const { playgroundStateProps, mapFileA } = playgroundSetupFactory();
      const state = resolvePlaygroundState({
        ...playgroundStateProps,
        file: null,
      });
      expect(state).toMatchObject({
        file: null,
        prompt: null,
        pin: null,
        prompts: [],
      });
    });
  });

  describe("cursor", () => {
    it("resolves prompt under cursor ", () => {
      const {
        mapPromptsA,
        editorFileB,
        mapPromptsB,
        parsedPromptsB,
        playgroundStateProps,
      } = playgroundSetupFactory({
        cursorA: editorCursorFactory({ offset: 8 }),
        cursorB: editorCursorFactory({ offset: 8 }),
      });

      expect(
        resolvePlaygroundState({ ...playgroundStateProps, pin: null }),
      ).toMatchObject({
        pin: null,
        prompt: expect.objectContaining({
          promptId: mapPromptsA[1].id,
          reason: "cursor",
        }),
      });

      expect(
        resolvePlaygroundState({
          ...playgroundStateProps,
          pin: null,
          file: editorFileB,
          parsedPrompts: parsedPromptsB,
        }),
      ).toMatchObject({
        pin: null,
        prompt: expect.objectContaining({
          promptId: mapPromptsB[0].id,
          reason: "cursor",
        }),
      });
    });

    it("resolves empty pin state when cursor is not defined", () => {
      const { playgroundStateProps } = playgroundSetupFactory({
        cursorA: undefined,
      });
      expect(resolvePlaygroundState(playgroundStateProps)).toMatchObject({
        prompt: null,
        pin: null,
      });
    });
  });

  describe("pinned", () => {
    it("resolves pinned prompt state ", () => {
      const { mapFileB, mapPromptsB, editorFileB, playgroundStateProps } =
        playgroundSetupFactory();

      const pin: PlaygroundState.Ref = {
        fileId: mapFileB.id,
        promptId: mapPromptsB[0].id,
      };

      const state = resolvePlaygroundState({
        ...playgroundStateProps,
        pin,
      });

      expect(state).toMatchObject({
        file: {
          isDirty: editorFileB.isDirty,
          languageId: editorFileB.languageId,
          path: editorFileB.path,
        },
        pin,
        prompt: expect.objectContaining({
          promptId: mapPromptsB[0].id,
          reason: "pinned",
        }),
        prompts: [
          expect.objectContaining({
            fileId: mapFileB.id,
            promptId: mapPromptsB[0].id,
          }),
        ],
      });
    });

    it("resolves active file empty state with pin file is missing", () => {
      const {
        mapFileA,
        mapPromptsA,
        mapPromptsB,
        editorFileA,
        playgroundStateProps,
      } = playgroundSetupFactory();

      const pin: PlaygroundState.Ref = {
        fileId: "missing" as PlaygroundMap.FileId,
        promptId: mapPromptsB[0].id,
      };

      const state = resolvePlaygroundState({
        ...playgroundStateProps,
        pin,
      });

      expect(state).toMatchObject({
        file: {
          isDirty: editorFileA.isDirty,
          languageId: editorFileA.languageId,
          path: editorFileA.path,
        },
        pin: null,
        prompt: null,
        prompts: [
          expect.objectContaining({
            fileId: mapFileA.id,
            promptId: mapPromptsA[0].id,
          }),
          expect.objectContaining({
            fileId: mapFileA.id,
            promptId: mapPromptsA[1].id,
          }),
        ],
      });
    });

    it("resolves active file empty state with pin prompt is missing", () => {
      const {
        mapFileA,
        mapPromptsA,
        mapFileB,
        editorFileA,
        playgroundStateProps,
      } = playgroundSetupFactory();

      const pin: PlaygroundState.Ref = {
        fileId: mapFileB.id,
        promptId: "missing" as PlaygroundMap.PromptId,
      };

      const state = resolvePlaygroundState({
        ...playgroundStateProps,
        pin,
      });

      expect(state).toMatchObject({
        file: {
          isDirty: editorFileA.isDirty,
          languageId: editorFileA.languageId,
          path: editorFileA.path,
        },
        pin: null,
        prompt: null,
        prompts: [
          expect.objectContaining({
            fileId: mapFileA.id,
            promptId: mapPromptsA[0].id,
          }),
          expect.objectContaining({
            fileId: mapFileA.id,
            promptId: mapPromptsA[1].id,
          }),
        ],
      });
    });
  });
});

//#endregion

//#region Map

describe(resolvePlaygroundMapFile, () => {
  it("resolves map file by id", () => {
    const { map, mapFileA } = playgroundSetupFactory();
    const result = resolvePlaygroundMapFile(map, mapFileA.id);
    expect(result).toBe(mapFileA);
  });

  it("returns null when map file id does not exist", () => {
    const { map } = playgroundSetupFactory();
    const result = resolvePlaygroundMapFile(
      map,
      "non-existent-id" as PlaygroundMap.FileId,
    );
    expect(result).toBeNull();
  });
});

describe(resolvePlaygroundMapPair, () => {
  it("resolves map pair by ref", () => {
    const { map, mapFileA, mapPromptsA } = playgroundSetupFactory();
    const ref: PlaygroundState.Ref = {
      fileId: mapFileA.id,
      promptId: mapPromptsA[0].id,
    };
    const result = resolvePlaygroundMapPair(map, ref);
    expect(result).toEqual([mapFileA, mapPromptsA[0]]);
  });

  it("returns null when map prompt id does not exist", () => {
    const { map, mapFileA } = playgroundSetupFactory();
    const ref: PlaygroundState.Ref = {
      fileId: mapFileA.id,
      promptId: "non-existent-id" as PlaygroundMap.PromptId,
    };
    const result = resolvePlaygroundMapPair(map, ref);
    expect(result).toBeNull();
  });
});

//#endregion

//#region Map files

describe(resolvePlaygroundMap, () => {
  it("returns the same map if nothing has changed", () => {
    const { map, editorFileA, parsedPromptsA } = playgroundSetupFactory();

    const timestamp = 1234567890;

    const result = resolvePlaygroundMap({
      timestamp,
      map,
      file: editorFileA,
      parsedPrompts: parsedPromptsA,
    });

    expect(result).toBe(map);
  });

  it("adds a new file if nothing matched", () => {
    const { map, editorFileA, mapFileA, editorFileB, mapFileB, mapPromptsA } =
      playgroundSetupFactory();

    const timestamp = 1234567890;
    const parsedPrompts = [parsedPromptFactory({ exp: "new prompt" })];
    const file = editorFileFactory();

    const result = resolvePlaygroundMap({
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(result).not.toBe(map);
    expect(result.files).not.toBe(map.files);
    expect(result.updatedAt).toBe(timestamp);

    expect(Object.keys(map.files).length).toBe(2);
    expect(Object.keys(result.files).length).toBe(3);

    expect(result.files[editorFileA.path]).toBe(mapFileA);
    expect(result.files[editorFileB.path]).toBe(mapFileB);

    expect(result.files[file.path]).toEqual({
      id: expect.any(String),
      meta: editorFileToMeta(file),
      prompts: [
        expect.objectContaining({
          id: expect.any(String),
          content: "new prompt",
          updatedAt: timestamp,
        }),
      ],
      updatedAt: timestamp,
    });
  });

  it("updates existing file when prompts have changed", () => {
    const { map, editorFileA, mapFileA, mapPromptsA, editorFileB, mapFileB } =
      playgroundSetupFactory();

    const timestamp = 1234567890;
    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha alpha" }),
      parsedPromptFactory({ exp: "beta" }),
    ];

    const result = resolvePlaygroundMap({
      timestamp,
      map,
      file: editorFileA,
      parsedPrompts,
    });

    expect(result).not.toBe(map);
    expect(result.files).not.toBe(map.files);
    expect(result.updatedAt).toBe(timestamp);

    expect(Object.keys(map.files).length).toBe(2);
    expect(Object.keys(result.files).length).toBe(2);

    expect(result.files[editorFileA.path]).not.toBe(mapFileA);
    expect(result.files[editorFileB.path]).toBe(mapFileB);
  });
});

describe(matchPlaygroundMapFile, () => {
  it("returns file when path matches the map entry", () => {
    const { map, editorFileA, parsedPromptsA, mapFileA } =
      playgroundSetupFactory();

    const timestamp = 1234567890;

    const match = matchPlaygroundMapFile({
      timestamp,
      map,
      file: editorFileA,
      parsedPrompts: parsedPromptsA,
    });

    expect(match).toEqual({
      mapFile: mapFileA,
      matchedPromptsScore: 1,
      matchingScore: 1,
      matchedCount: 2,
      changed: false,
    });
  });

  it("falls back to distance matching when path differs", () => {
    const { map, mapFileA, mapPromptsA } = playgroundSetupFactory();

    const file = editorFileFactory();

    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha" }),
      parsedPromptFactory({ exp: "beta b" }),
    ] as const;

    const timestamp = 1234567890;

    const match = matchPlaygroundMapFile({
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: {
        id: mapFileA.id,
        updatedAt: timestamp,
        meta: editorFileToMeta(file),
        prompts: [
          {
            id: mapPromptsA[0].id,
            content: parsedPrompts[0].exp,
            span: parsedPrompts[0].span.outer,
            updatedAt: mapPromptsA[0].updatedAt,
          },
          {
            id: mapPromptsA[1].id,
            content: parsedPrompts[1].exp,
            span: parsedPrompts[1].span.outer,
            updatedAt: timestamp,
          },
        ],
      },
      matchedPromptsScore: 1,
      matchingScore: expect.closeTo(0.67),
      matchedCount: 2,
      changed: true,
    });
  });

  it("falls back to distance matching when content differs", () => {
    const { map, mapFileA, mapFileB, mapPromptsB } = playgroundSetupFactory();

    const file = editorFileFactory({ path: mapFileA.meta.path });

    const parsedPrompts = [parsedPromptFactory({ exp: "gamma" })] as const;

    const timestamp = 1234567890;

    const match = matchPlaygroundMapFile({
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: {
        id: mapFileB.id,
        updatedAt: timestamp,
        meta: editorFileToMeta(file),
        prompts: [{ ...mapPromptsB[0], span: parsedPrompts[0].span.outer }],
      },
      matchedPromptsScore: 1,
      matchingScore: 1,
      matchedCount: 1,
      changed: true,
    });
  });

  it("returns new map file if no match found", () => {
    const { map } = playgroundSetupFactory();

    const file = editorFileFactory();

    const parsedPrompts = [
      parsedPromptFactory({ exp: "Hello, world!" }),
      parsedPromptFactory({ exp: "How are you doing?" }),
    ] as const;

    const timestamp = 1234567890;

    const match = matchPlaygroundMapFile({
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: {
        id: expect.any(String),
        meta: editorFileToMeta(file),
        updatedAt: timestamp,
        prompts: [
          expect.objectContaining({
            content: parsedPrompts[0].exp,
            updatedAt: timestamp,
          }),
          expect.objectContaining({
            content: parsedPrompts[1].exp,
            updatedAt: timestamp,
          }),
        ],
      },
      matchedPromptsScore: 0,
      matchingScore: 0,
      matchedCount: 0,
      changed: true,
    });
  });

  it("clones file matched by path", () => {
    const { map, editorFileA, parsedPromptsA, mapFileA } =
      playgroundSetupFactory();

    const match = matchPlaygroundMapFile({
      timestamp: Date.now(),
      map,
      file: editorFileA,
      parsedPrompts: parsedPromptsA,
    });

    expect(match).not.toBe(mapFileA);
  });
});

describe(matchPlaygroundMapFileByDistance, () => {
  it("returns best scoring file above threshold with updated prompts", () => {
    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha" }),
      parsedPromptFactory({ exp: "beta" }),
      parsedPromptFactory({ exp: "gamma" }),
    ] as const;

    const mapPrompts1 = [
      playgroundMapPromptFactory({ content: "gamma" }),
      playgroundMapPromptFactory({ content: "alpha abc" }),
    ] as const;
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = [
      playgroundMapPromptFactory({ content: "beta def" }),
    ] as const;
    const mapFile2 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/two.ts"),
      }),
      prompts: mapPrompts2,
    });

    const mapPrompts3 = [
      playgroundMapPromptFactory({ content: "beta a" }),
      playgroundMapPromptFactory({ content: "gamma" }),
      playgroundMapPromptFactory({ content: "alpha abc" }),
    ] as const;
    const mapFile3 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/three.ts"),
      }),
      prompts: mapPrompts3,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile1.meta.path]: mapFile1,
        [mapFile2.meta.path]: mapFile2,
        [mapFile3.meta.path]: mapFile3,
      },
    });

    const timestamp = 1234567890;
    const file = editorFileFactory();

    const match = matchPlaygroundMapFileByDistance({
      timestamp,
      file,
      map,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: {
        id: mapFile3.id,
        updatedAt: timestamp,
        meta: editorFileToMeta(file),
        prompts: [
          {
            id: mapPrompts3[2].id,
            content: parsedPrompts[0].exp,
            span: parsedPrompts[0].span.outer,
            updatedAt: timestamp,
          },
          {
            id: mapPrompts3[0].id,
            content: parsedPrompts[1].exp,
            span: parsedPrompts[1].span.outer,
            updatedAt: timestamp,
          },
          { ...mapPrompts3[1], span: parsedPrompts[2].span.outer },
        ],
      },
      matchedPromptsScore: 1,
      matchingScore: expect.closeTo(0.59),
      matchedCount: 3,
      changed: true,
    });
  });

  it("updates file path", () => {
    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha" }),
      parsedPromptFactory({ exp: "beta" }),
      parsedPromptFactory({ exp: "gamma" }),
    ] as const;

    const mapPrompts1 = [
      playgroundMapPromptFactory({ content: "hello" }),
      playgroundMapPromptFactory({ content: "gg" }),
    ] as const;
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = [
      playgroundMapPromptFactory({ content: "alpha" }),
      playgroundMapPromptFactory({ content: "beta" }),
      playgroundMapPromptFactory({ content: "gamma" }),
    ] as const;
    const mapFile2 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/two.ts"),
      }),
      prompts: mapPrompts2,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile1.meta.path]: mapFile1,
        [mapFile2.meta.path]: mapFile2,
      },
    });

    const timestamp = 1234567890;

    const file = editorFileFactory();

    const match = matchPlaygroundMapFileByDistance({
      timestamp,
      file,
      map,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: {
        ...mapFile2,
        prompts: [
          { ...mapPrompts2[0], span: parsedPrompts[0].span.outer },
          { ...mapPrompts2[1], span: parsedPrompts[1].span.outer },
          { ...mapPrompts2[2], span: parsedPrompts[2].span.outer },
        ],
        meta: editorFileToMeta(file),
        updatedAt: timestamp,
      },
      matchedPromptsScore: 1,
      matchingScore: 1,
      matchedCount: 3,
      changed: true,
    });
  });

  it("returns null if no matching prompts are found", () => {
    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha" }),
      parsedPromptFactory({ exp: "beta" }),
      parsedPromptFactory({ exp: "gamma" }),
    ] as const;

    const mapPrompts1 = [
      playgroundMapPromptFactory({ content: "hello" }),
      playgroundMapPromptFactory({ content: "gg" }),
    ] as const;
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = [
      playgroundMapPromptFactory({ content: "yo" }),
    ] as const;
    const mapFile2 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/two.ts"),
      }),
      prompts: mapPrompts2,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile1.meta.path]: mapFile1,
        [mapFile2.meta.path]: mapFile2,
      },
    });

    const match = matchPlaygroundMapFileByDistance({
      timestamp: Date.now(),
      file: editorFileFactory(),
      map,
      parsedPrompts,
    });

    expect(match).toBe(null);
  });

  it("preserves updatedAt if nothing has changed", () => {
    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha" }),
      parsedPromptFactory({ exp: "beta" }),
      parsedPromptFactory({ exp: "gamma" }),
    ] as const;

    const mapPrompts1 = [
      playgroundMapPromptFactory({ content: "hello" }),
      playgroundMapPromptFactory({ content: "gg" }),
    ] as const;
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = [
      playgroundMapPromptFactory({ content: "alpha" }),
      playgroundMapPromptFactory({ content: "beta" }),
      playgroundMapPromptFactory({ content: "gamma" }),
    ] as const;
    const mapFile2 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/two.ts"),
      }),
      prompts: mapPrompts2,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile1.meta.path]: mapFile1,
        [mapFile2.meta.path]: mapFile2,
      },
    });

    const timestamp = 1234567890;

    const match = matchPlaygroundMapFileByDistance({
      timestamp,
      file: { ...mapFile2.meta, content: "" },
      map,
      parsedPrompts,
    });

    expect(match?.mapFile).toEqual({
      ...mapFile2,
      prompts: [
        { ...mapPrompts2[0], span: parsedPrompts[0].span.outer },
        { ...mapPrompts2[1], span: parsedPrompts[1].span.outer },
        { ...mapPrompts2[2], span: parsedPrompts[2].span.outer },
      ],
    });
  });

  it("clones matched file", () => {
    const { parsedPrompts, map, editorFileA, mapFileA } =
      playgroundSetupFactory();
    const match = matchPlaygroundMapFileByDistance({
      file: editorFileA,
      timestamp: Date.now(),
      map,
      parsedPrompts,
    });
    expect(match?.mapFile).not.toBe(mapFileA);
    expect(match?.mapFile.meta).not.toBe(mapFileA.meta);
    expect(match?.mapFile.prompts).not.toBe(mapFileA.prompts);
  });
});

//#endregion

//#region Map prompts

describe(matchPlaygroundMapPrompts, () => {
  it("preserves matched prompt ids and inserts new prompts in parsed order", () => {
    const { mapPrompts } = playgroundSetupFactory();
    const parsedPrompts = [
      parsedPromptFactory({ exp: "gamma" }),
      parsedPromptFactory({ exp: "alp beta" }),
      parsedPromptFactory({ exp: "alpha abc" }),
      parsedPromptFactory({ exp: "alpha ab" }),
      parsedPromptFactory({ exp: "alpha a" }),
    ] as const;

    const timestamp = 1234567890;

    const result = matchPlaygroundMapPrompts({
      timestamp,
      mapPrompts,
      parsedPrompts,
    });

    expect(result).toEqual({
      nextMapPrompts: [
        { ...mapPrompts[2], span: parsedPrompts[0].span.outer },
        {
          id: mapPrompts[1].id,
          content: parsedPrompts[1].exp,
          span: parsedPrompts[1].span.outer,
          updatedAt: timestamp,
        },
        {
          id: expect.any(String),
          content: parsedPrompts[2].exp,
          span: parsedPrompts[2].span.outer,
          updatedAt: timestamp,
        },
        {
          id: expect.any(String),
          content: parsedPrompts[3].exp,
          span: parsedPrompts[3].span.outer,
          updatedAt: timestamp,
        },
        {
          id: mapPrompts[0].id,
          content: parsedPrompts[4].exp,
          span: parsedPrompts[4].span.outer,
          updatedAt: timestamp,
        },
      ],
      matchedPromptsScore: expect.closeTo(1),
      matchingScore: expect.closeTo(0.6),
      matchedCount: 3,
      changed: true,
    });
  });

  it("returns changed: false if all prompts matched by content", () => {
    const { mapPromptsA, parsedPromptsA } = playgroundSetupFactory();

    const result = matchPlaygroundMapPrompts({
      timestamp: Date.now(),
      mapPrompts: mapPromptsA,
      parsedPrompts: parsedPromptsA,
    });

    expect(result.changed).toBe(false);
  });

  it("returns changed: true if order has changed", () => {
    const { mapPromptsA, parsedPromptsA } = playgroundSetupFactory();

    const result = matchPlaygroundMapPrompts({
      timestamp: Date.now(),
      mapPrompts: mapPromptsA,
      parsedPrompts: [parsedPromptsA[1], parsedPromptsA[0]],
    });

    expect(result.changed).toBe(true);
  });

  it("returns changed: true if content has changed", () => {
    const { mapPromptsA, parsedPromptsA } = playgroundSetupFactory();

    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha abc" }),
      parsedPromptFactory({ exp: "beta" }),
    ];

    const result = matchPlaygroundMapPrompts({
      timestamp: Date.now(),
      mapPrompts: mapPromptsA,
      parsedPrompts,
    });

    expect(result.changed).toBe(true);
  });

  it("returns changed: true if new prompts are added", () => {
    const { mapPromptsA, parsedPromptsA } = playgroundSetupFactory();

    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha" }),
      parsedPromptFactory({ exp: "beta" }),
      parsedPromptFactory({ exp: "delta" }),
    ];

    const result = matchPlaygroundMapPrompts({
      timestamp: Date.now(),
      mapPrompts: mapPromptsA,
      parsedPrompts,
    });

    expect(result.changed).toBe(true);
  });

  it("does not mutate original map prompts", () => {
    const { mapPrompts } = playgroundSetupFactory();
    const parsedPrompts = [] as const;

    const result = matchPlaygroundMapPrompts({
      timestamp: Date.now(),
      mapPrompts,
      parsedPrompts,
    });

    expect(result.nextMapPrompts).not.toBe(mapPrompts);
  });

  it("clones existing map prompts", () => {
    const { mapPromptsA, parsedPromptsA } = playgroundSetupFactory();

    const result = matchPlaygroundMapPrompts({
      timestamp: Date.now(),
      mapPrompts: mapPromptsA,
      parsedPrompts: parsedPromptsA,
    });

    expect(result.nextMapPrompts[0]).not.toBe(mapPromptsA[0]);
    expect(result.nextMapPrompts[1]).not.toBe(mapPromptsA[1]);
  });
});

describe(matchPlaygroundMapPromptsByContent, () => {
  it("matches prompts with identical content", () => {
    const { mapPromptsA } = playgroundSetupFactory();
    const parsedPrompts = [
      parsedPromptFactory({ exp: "beta" }),
      parsedPromptFactory({ exp: "delta" }),
    ] as const;

    const result = matchPlaygroundMapPromptsByContent({
      unmatchedParsedPrompts: new Set(parsedPrompts),
      unmatchedMapPrompts: new Set(mapPromptsA),
    });

    const matchedMapPrompts = new Map();
    matchedMapPrompts.set(parsedPrompts[0], {
      ...mapPromptsA[1],
      span: parsedPrompts[0].span.outer,
    });

    expect(result).toEqual({
      matchedMapPrompts,
      unmatchedParsedPrompts: new Set([parsedPrompts[1]]),
      unmatchedMapPrompts: new Set([mapPromptsA[0]]),
      matchingScores: expect.any(Object),
    });

    expect([...result.matchingScores.values()]).toEqual([1]);
  });

  it("clones argument sets", () => {
    const unmatchedParsedPrompts = new Set<any>();
    const unmatchedMapPrompts = new Set<any>();

    const result = matchPlaygroundMapPromptsByContent({
      unmatchedParsedPrompts,
      unmatchedMapPrompts,
    });

    expect(result.unmatchedMapPrompts).not.toBe(unmatchedMapPrompts);
    expect(result.unmatchedParsedPrompts).not.toBe(unmatchedParsedPrompts);
  });
});

describe(matchPlaygroundMapPromptsByDistance, () => {
  it("matches prompts within Levenshtein threshold", () => {
    const { mapPromptsA } = playgroundSetupFactory();
    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha beta" }),
      parsedPromptFactory({ exp: "alpha qwerty" }),
      parsedPromptFactory({ exp: "alpha a" }),
      parsedPromptFactory({ exp: "alpha ab" }),
    ] as const;

    const result = matchPlaygroundMapPromptsByDistance({
      timestamp: Date.now(),
      unmatchedMapPrompts: new Set(mapPromptsA),
      unmatchedParsedPrompts: new Set(parsedPrompts),
    });

    const matchedMapPrompts = new Map();
    matchedMapPrompts.set(parsedPrompts[0], {
      id: mapPromptsA[1].id,
      content: parsedPrompts[0].exp,
      span: parsedPrompts[0].span.outer,
      updatedAt: expect.any(Number),
    });
    matchedMapPrompts.set(parsedPrompts[2], {
      id: mapPromptsA[0].id,
      content: parsedPrompts[2].exp,
      span: parsedPrompts[2].span.outer,
      updatedAt: expect.any(Number),
    });

    expect(result).toEqual({
      matchedMapPrompts,
      unmatchedParsedPrompts: new Set([parsedPrompts[1], parsedPrompts[3]]),
      unmatchedMapPrompts: new Set([]),
      matchingScores: expect.any(Object),
    });

    expect([...result.matchingScores.values()]).toEqual([
      expect.closeTo(0.29),
      expect.closeTo(0.6),
    ]);
  });

  it("returns nothing when matches does not pass threshold", () => {
    const { mapPromptsA } = playgroundSetupFactory({
      expAlpha: "Plan a 3-day trip to Tokyo for food lovers.",
      expBeta:
        "Give me 5 creative app ideas that use AI for personal productivity.",
      expGamma: `Rewrite this paragraph in a more professional tone:

{{text}}`,
    });
    const parsedPrompts = [
      parsedPromptFactory({ exp: "creative" }),
      parsedPromptFactory({ exp: "this paragraph" }),
      parsedPromptFactory({ exp: "food lovers" }),
    ];

    const result = matchPlaygroundMapPromptsByDistance({
      timestamp: Date.now(),
      unmatchedMapPrompts: new Set(mapPromptsA),
      unmatchedParsedPrompts: new Set(parsedPrompts),
    });

    expect(result.matchedMapPrompts.size).toEqual(0);
  });

  it("matches prompts with significant changes that pass the threshold", () => {
    const { mapPrompts } = playgroundSetupFactory({
      expAlpha: "Plan a 3-day trip to Tokyo for food lovers.",
      expBeta:
        "Give me 5 creative app ideas that use AI for personal productivity.",
      expGamma: `I want you to act as a creative product strategist specializing in AI-powered tools that improve personal productivity.

Please brainstorm 5 original and feasible app ideas that use artificial intelligence to help individuals manage their time, focus better, or optimize daily workflows. Avoid generic ideas like “AI task manager” or “AI note-taker” — instead, think creatively about emerging behaviors, novel UX patterns, and unique value propositions.

For each app idea, include the following:

Name: A catchy and memorable product name.

Core Concept: A concise description (2-3 sentences) of what the app does and the problem it solves.

AI Capabilities: Explain how AI specifically powers the experience — for example, through context understanding, behavioral prediction, personalization, automation, or multimodal inputs (voice, vision, etc.).

Target Users: Describe who would benefit most from the app — e.g., freelancers, students, parents, executives.

Example Use Case: A short, concrete scenario showing how someone would use the app in their daily routine.

Potential Business Model: (Optional) Suggest how this could be monetized — subscription, B2B licensing, in-app purchases, etc.

Your output should read like a mini product concept brief — concise but full of insight and creativity.

The tone should be professional yet imaginative, similar to how a design strategist or startup founder would pitch early-stage product ideas to investors or collaborators.

Aim for freshness and originality — imagine what productivity tools could look like in 2-3 years, not what already exists today.
`,
    });
    const parsedPrompts = [
      parsedPromptFactory({
        exp: "Plan a {{length}} trip to {{destination}} for {{audience}}.",
      }),
      parsedPromptFactory({
        exp: "I want you to generate me 5 creative app ideas that use AI for {{audience}}.",
      }),
      parsedPromptFactory({
        exp: `I want you to act as a creative product strategist who specializes in AI-powered tools that enhance personal productivity.

Please brainstorm 5 original and practical app ideas that use artificial intelligence to help individuals manage their time, focus better, or optimize their daily routines. Avoid generic ideas like “AI task manager” or “AI note-taker.” Instead, focus on novel interactions, emerging behaviors, and fresh value propositions.

For each app, include:

Name: A catchy, memorable product name.

Core Concept: A concise 2-3 sentence summary describing what the app does and what problem it solves.

AI Capabilities: Explain how AI powers the experience — e.g., through context awareness, prediction, personalization, automation, or multimodal input (voice, image, etc.).

Target Users: Describe who would benefit most — freelancers, students, parents, or executives.

Example Use Case: Give a short, concrete example of how someone might use the app in daily life.

Potential Business Model: (Optional) Suggest a way it could be monetized — subscription, freemium, B2B licensing, etc.

Your output should read like a mini product concept brief — short but full of insight and creativity.

Keep the tone professional yet imaginative, like a design strategist or startup founder pitching early-stage concepts.

Emphasize freshness and originality — ideas that could realistically exist 2-3 years from now, not ones already on the market.`,
      }),
    ] as const;

    const result = matchPlaygroundMapPromptsByDistance({
      timestamp: Date.now(),
      unmatchedMapPrompts: new Set(mapPrompts),
      unmatchedParsedPrompts: new Set(parsedPrompts),
    });

    const matchedMapPrompts = new Map();
    matchedMapPrompts.set(parsedPrompts[0], {
      id: mapPrompts[0].id,
      content: parsedPrompts[0].exp,
      span: parsedPrompts[0].span.outer,
      updatedAt: expect.any(Number),
    });
    matchedMapPrompts.set(parsedPrompts[1], {
      id: mapPrompts[1].id,
      content: parsedPrompts[1].exp,
      span: parsedPrompts[1].span.outer,
      updatedAt: expect.any(Number),
    });
    matchedMapPrompts.set(parsedPrompts[2], {
      id: mapPrompts[2].id,
      content: parsedPrompts[2].exp,
      span: parsedPrompts[2].span.outer,
      updatedAt: expect.any(Number),
    });

    expect(result).toEqual({
      matchedMapPrompts,
      unmatchedParsedPrompts: new Set([]),
      unmatchedMapPrompts: new Set([]),
      matchingScores: expect.any(Object),
    });

    expect([...result.matchingScores.values()]).toEqual([
      expect.closeTo(0.26),
      expect.closeTo(0.53),
      expect.closeTo(0.58),
    ]);
  });

  it("assigns current timestamp to updated prompts", () => {
    const { mapPromptsA } = playgroundSetupFactory();
    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha a" }),
      parsedPromptFactory({ exp: "beta b" }),
    ] as const;

    const timestamp = 1234567890;

    const result = matchPlaygroundMapPromptsByDistance({
      timestamp,
      unmatchedParsedPrompts: new Set(parsedPrompts),
      unmatchedMapPrompts: new Set(mapPromptsA),
    });

    expect(Array.from(result.matchedMapPrompts.values())).toEqual([
      expect.objectContaining({ updatedAt: timestamp }),
      expect.objectContaining({ updatedAt: timestamp }),
    ]);
  });

  it("clones argument sets", () => {
    const unmatchedMapPrompts = new Set([]);
    const unmatchedParsedPrompts = new Set([]);

    const result = matchPlaygroundMapPromptsByDistance({
      timestamp: Date.now(),
      unmatchedMapPrompts,
      unmatchedParsedPrompts,
    });

    expect(result.unmatchedMapPrompts).not.toBe(unmatchedMapPrompts);
    expect(result.unmatchedParsedPrompts).not.toBe(unmatchedParsedPrompts);
  });
});

describe(calcMatchedPromptsScore, () => {
  it("returns ratio of matched prompts", () => {
    const { mapPrompts } = playgroundSetupFactory();
    const parsedPrompts = [
      parsedPromptFactory({ exp: "alpha beta" }),
      parsedPromptFactory({ exp: "alpha qwerty" }),
      parsedPromptFactory({ exp: "alpha a" }),
      parsedPromptFactory({ exp: "alpha ab" }),
    ] as const;

    const matchedMapPrompts = new Map();
    matchedMapPrompts.set(parsedPrompts[0], mapPrompts[1]);
    matchedMapPrompts.set(parsedPrompts[2], mapPrompts[0]);

    const score = calcMatchedPromptsScore({
      matchedMapPrompts,
      unmatchedMapPrompts: new Set([mapPrompts[2]]),
    });

    expect(score).toBeCloseTo(0.666);
  });

  it("returns 1 when all prompts matched", () => {
    const { mapPromptsA, parsedPromptsA } = playgroundSetupFactory();

    const matchedMapPrompts = new Map();
    matchedMapPrompts.set(parsedPromptsA[0], mapPromptsA[0]);
    matchedMapPrompts.set(parsedPromptsA[1], mapPromptsA[1]);

    const score = calcMatchedPromptsScore({
      matchedMapPrompts,
      unmatchedMapPrompts: new Set([]),
    });

    expect(score).toBe(1);
  });

  it("returns 0 when none prompts matched", () => {
    const score = calcMatchedPromptsScore({
      matchedMapPrompts: new Map(),
      unmatchedMapPrompts: new Set([]),
    });

    expect(score).toBe(0);
  });
});

//#endregion
