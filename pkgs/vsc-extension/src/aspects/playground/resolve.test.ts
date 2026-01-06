import { PromptVar } from "@volumen/types";
import { EditorFile, editorFileToMeta } from "@wrkspc/core/editor";
import {
  buildMapPromptVarId,
  playgroundMapSpanFromPrompt,
  playgroundMapVarsFromPrompt,
  toPlaygroundMapPrompt,
  type PlaygroundMap,
  type PlaygroundState,
} from "@wrkspc/core/playground";
import { describe, expect, it } from "vitest";
import {
  editorCursorFactory,
  editorFileFactory,
  editorFileMetaFactory,
  editorFilePathFactory,
  playgroundMapFactory,
  playgroundMapFileFactory,
  playgroundMapPromptCodeV2ToV1,
  playgroundMapPromptDraftFactoryV1,
  playgroundMapPromptVarV2ToV1,
  playgroundSetupFactoryV1,
  TEST_FILE_A_PARSED_RESULT,
  TEST_FILE_A_SOURCE,
  TEST_FILE_C_PARSED_RESULT,
  TEST_FILE_C_SOURCE,
  TEST_FILE_D_PARSED_RESULT,
  TEST_FILE_D_SOURCE,
  TEST_FILE_E_PARSED_RESULT,
  TEST_FILE_E_SOURCE,
  TEST_FILE_F_PARSED_RESULT,
  TEST_FILE_F_SOURCE,
} from "./__tests__/factories";
import {
  calcMatchedPromptsScore,
  matchPlaygroundMapFile,
  matchPlaygroundMapFileByDistance,
  matchPlaygroundMapPrompts,
  matchPlaygroundMapPromptsByContent,
  matchPlaygroundMapPromptsByDistance,
  matchPlaygroundMapPromptVars,
  matchPlaygroundMapPromptVarsByContent,
  matchPlaygroundMapPromptVarsByDistance,
  resolvePlaygroundMap,
  resolvePlaygroundMapFile,
  resolvePlaygroundMapPair,
  resolvePlaygroundState,
} from "./resolve";

//#region State

describe(resolvePlaygroundState, () => {
  describe("file", () => {
    it("resolves current file state", () => {
      const { playgroundStateProps, editorFileA, mapFileA, mapPromptsA } =
        playgroundSetupFactoryV1();

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

    it("resolves empty state when current file is not defined", () => {
      const { playgroundStateProps, mapFileA } = playgroundSetupFactoryV1();
      const state = resolvePlaygroundState({
        ...playgroundStateProps,
        currentFile: null,
      });
      expect(state).toMatchObject({
        file: null,
        prompt: null,
        pin: null,
        prompts: [],
      });
    });

    it("includes parser error in state", () => {
      const { playgroundStateProps, editorFileA, mapFileA, mapPromptsA } =
        playgroundSetupFactoryV1();

      const parseError = "Ooops, syntax error!";

      expect(
        resolvePlaygroundState({
          ...playgroundStateProps,
          parseError,
        }),
      ).toMatchObject({
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
        parseError,
      });
    });

    it("ignores parse error if current file is not defined", () => {
      const { playgroundStateProps } = playgroundSetupFactoryV1();
      const state = resolvePlaygroundState({
        ...playgroundStateProps,
        currentFile: null,
        parseError: "Ooops, syntax error!",
      });

      expect(state).toMatchObject({
        file: null,
        prompt: null,
        pin: null,
        prompts: [],
        parseError: null,
      });
    });

    it("includes draft prompts in state", () => {
      const { playgroundStateProps, mapFileA, mapPromptsA } =
        playgroundSetupFactoryV1();

      const draftPrompt = playgroundMapPromptDraftFactoryV1();

      const state = resolvePlaygroundState({
        ...playgroundStateProps,
        drafts: {
          [draftPrompt.id]: draftPrompt,
        },
      });

      expect(state).toMatchObject({
        prompts: [
          expect.objectContaining({
            type: "code",
            fileId: mapFileA.id,
            promptId: mapPromptsA[0].id,
          }),
          expect.objectContaining({
            type: "code",
            fileId: mapFileA.id,
            promptId: mapPromptsA[1].id,
          }),
          expect.objectContaining({
            type: "draft",
            promptId: draftPrompt.id,
          }),
        ],
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
      } = playgroundSetupFactoryV1({
        cursorA: editorCursorFactory({ offset: 8 }),
        cursorB: editorCursorFactory({ offset: 8 }),
      });

      expect(
        resolvePlaygroundState({ ...playgroundStateProps, pin: null }),
      ).toMatchObject({
        pin: null,
        prompt: expect.objectContaining({
          prompt: expect.objectContaining({
            id: mapPromptsA[1].id,
          }),
          reason: "cursor",
        }),
      });

      expect(
        resolvePlaygroundState({
          ...playgroundStateProps,
          pin: null,
          currentFile: editorFileB,
          editorFile: editorFileB,
          parsedPrompts: parsedPromptsB,
        }),
      ).toMatchObject({
        pin: null,
        prompt: expect.objectContaining({
          prompt: expect.objectContaining({
            id: mapPromptsB[0].id,
          }),
          reason: "cursor",
        }),
      });
    });

    it("resolves empty pin state when cursor is not defined", () => {
      const { playgroundStateProps } = playgroundSetupFactoryV1({
        cursorA: undefined,
      });
      expect(resolvePlaygroundState(playgroundStateProps)).toMatchObject({
        prompt: null,
        pin: null,
      });
    });

    it("includes parse error in state", () => {
      const {
        mapPromptsA,
        editorFileB,
        mapPromptsB,
        parsedPromptsB,
        playgroundStateProps,
      } = playgroundSetupFactoryV1({
        cursorA: editorCursorFactory({ offset: 8 }),
        cursorB: editorCursorFactory({ offset: 8 }),
      });

      const parseError = "Ooops, syntax error!";

      expect(
        resolvePlaygroundState({
          ...playgroundStateProps,
          pin: null,
          parseError,
        }),
      ).toMatchObject({
        pin: null,
        prompt: expect.objectContaining({
          prompt: expect.objectContaining({
            id: mapPromptsA[1].id,
          }),
          reason: "cursor",
        }),
        parseError,
      });

      expect(
        resolvePlaygroundState({
          ...playgroundStateProps,
          pin: null,
          currentFile: editorFileB,
          editorFile: editorFileB,
          parsedPrompts: parsedPromptsB,
          parseError,
        }),
      ).toMatchObject({
        pin: null,
        prompt: expect.objectContaining({
          prompt: expect.objectContaining({
            id: mapPromptsB[0].id,
          }),
          reason: "cursor",
        }),
        parseError,
      });
    });

    it("includes draft prompts in state", () => {
      const {
        mapFileA,
        mapPromptsA,
        mapPromptsB,
        mapFileB,
        editorFileB,
        parsedPromptsB,
        playgroundStateProps,
      } = playgroundSetupFactoryV1();

      const draftPrompt = playgroundMapPromptDraftFactoryV1();
      const drafts = {
        [draftPrompt.id]: draftPrompt,
      };

      expect(
        resolvePlaygroundState({ ...playgroundStateProps, pin: null, drafts }),
      ).toMatchObject({
        prompts: [
          expect.objectContaining({
            type: "code",
            fileId: mapFileA.id,
            promptId: mapPromptsA[0].id,
          }),
          expect.objectContaining({
            type: "code",
            fileId: mapFileA.id,
            promptId: mapPromptsA[1].id,
          }),
          expect.objectContaining({
            type: "draft",
            promptId: draftPrompt.id,
          }),
        ],
      });

      expect(
        resolvePlaygroundState({
          ...playgroundStateProps,
          pin: null,
          currentFile: editorFileB,
          editorFile: editorFileB,
          parsedPrompts: parsedPromptsB,
          drafts,
        }),
      ).toMatchObject({
        prompts: [
          expect.objectContaining({
            type: "code",
            fileId: mapFileB.id,
            promptId: mapPromptsB[0].id,
          }),
          expect.objectContaining({
            type: "draft",
            promptId: draftPrompt.id,
          }),
        ],
      });
    });
  });

  describe("pinned", () => {
    it("resolves pinned prompt state ", () => {
      const { mapFileB, mapPromptsB, editorFileB, playgroundStateProps } =
        playgroundSetupFactoryV1();

      const pin: PlaygroundState.Ref = {
        v: 1,
        type: "code",
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
          prompt: expect.objectContaining({
            id: mapPromptsB[0].id,
          }),
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

    it("resolves current file empty state with pin file is missing", () => {
      const {
        mapFileA,
        mapPromptsA,
        mapPromptsB,
        editorFileA,
        playgroundStateProps,
      } = playgroundSetupFactoryV1();

      const pin: PlaygroundState.Ref = {
        v: 1,
        type: "code",
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

    it("resolves current file empty state with pin prompt is missing", () => {
      const {
        mapFileA,
        mapPromptsA,
        mapFileB,
        editorFileA,
        playgroundStateProps,
      } = playgroundSetupFactoryV1();

      const pin: PlaygroundState.Ref = {
        v: 1,
        type: "code",
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

    it("prioritizes cursor reason even when pinned", () => {
      const {
        mapPromptsA,
        mapFileA,
        editorFileB,
        mapPromptsB,
        parsedPromptsB,
        playgroundStateProps,
      } = playgroundSetupFactoryV1({
        cursorA: editorCursorFactory({ offset: 8 }),
        cursorB: editorCursorFactory({ offset: 8 }),
      });

      const pin: PlaygroundState.Ref = {
        v: 1,
        type: "code",
        fileId: mapFileA.id,
        promptId: mapPromptsA[1].id,
      };

      expect(
        resolvePlaygroundState({ ...playgroundStateProps, pin }),
      ).toMatchObject({
        pin,
        prompt: expect.objectContaining({
          prompt: expect.objectContaining({
            id: mapPromptsA[1].id,
          }),
          reason: "cursor",
        }),
      });

      expect(
        resolvePlaygroundState({
          ...playgroundStateProps,
          pin,
          editorFile: editorFileB,
        }),
      ).toMatchObject({
        pin,
        prompt: expect.objectContaining({
          prompt: expect.objectContaining({
            id: mapPromptsA[1].id,
          }),
          reason: "pinned",
        }),
      });
    });

    it("includes parse error in state", () => {
      const { mapFileB, mapPromptsB, editorFileB, playgroundStateProps } =
        playgroundSetupFactoryV1();

      const pin: PlaygroundState.Ref = {
        v: 1,
        type: "code",
        fileId: mapFileB.id,
        promptId: mapPromptsB[0].id,
      };

      const parseError = "Ooops, syntax error!";

      const state = resolvePlaygroundState({
        ...playgroundStateProps,
        pin,
        parseError,
      });

      expect(state).toMatchObject({
        file: {
          isDirty: editorFileB.isDirty,
          languageId: editorFileB.languageId,
          path: editorFileB.path,
        },
        pin,
        prompt: expect.objectContaining({
          prompt: expect.objectContaining({
            id: mapPromptsB[0].id,
          }),
          reason: "pinned",
        }),
        prompts: [
          expect.objectContaining({
            fileId: mapFileB.id,
            promptId: mapPromptsB[0].id,
          }),
        ],
        parseError,
      });
    });

    it("includes draft prompts in state", () => {
      const { mapFileB, mapPromptsB, playgroundStateProps } =
        playgroundSetupFactoryV1();

      const pin: PlaygroundState.Ref = {
        v: 1,
        type: "code",
        fileId: mapFileB.id,
        promptId: mapPromptsB[0].id,
      };

      const draftPrompt = playgroundMapPromptDraftFactoryV1();

      const state = resolvePlaygroundState({
        ...playgroundStateProps,
        pin,
        drafts: {
          [draftPrompt.id]: draftPrompt,
        },
      });

      expect(state).toMatchObject({
        prompts: [
          expect.objectContaining({
            type: "code",
            fileId: mapFileB.id,
            promptId: mapPromptsB[0].id,
          }),
          expect.objectContaining({
            type: "draft",
            promptId: draftPrompt.id,
          }),
        ],
      });
    });
  });

  describe("draft", () => {
    it("resolves pinned draft prompt state ", () => {
      const { editorFileA, mapFileA, mapPromptsA, playgroundStateProps } =
        playgroundSetupFactoryV1();

      const draftPrompt = playgroundMapPromptDraftFactoryV1();

      const pin: PlaygroundState.Ref = {
        v: 1,
        type: "draft",
        promptId: draftPrompt.id,
      };

      const state = resolvePlaygroundState({
        ...playgroundStateProps,
        pin,
        drafts: {
          [draftPrompt.id]: draftPrompt,
        },
      });

      expect(state).toMatchObject({
        file: {
          isDirty: editorFileA.isDirty,
          languageId: editorFileA.languageId,
          path: editorFileA.path,
        },
        pin,
        prompt: expect.objectContaining({
          prompt: expect.objectContaining({
            type: "draft",
            id: draftPrompt.id,
          }),
        }),
        prompts: [
          expect.objectContaining({
            type: "code",
            fileId: mapFileA.id,
            promptId: mapPromptsA[0].id,
          }),
          expect.objectContaining({
            type: "code",
            fileId: mapFileA.id,
            promptId: mapPromptsA[1].id,
          }),
          expect.objectContaining({
            type: "draft",
            promptId: draftPrompt.id,
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
    const mapPrompts = TEST_FILE_F_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_F_SOURCE,
        prompt,
      }),
    );
    const mapFile = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile.meta.path]: mapFile,
      },
    });

    const result = resolvePlaygroundMapFile(map, mapFile.id);
    expect(result).toBe(mapFile);
  });

  it("returns null when map file id does not exist", () => {
    const mapPrompts = TEST_FILE_F_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_F_SOURCE,
        prompt,
      }),
    );
    const mapFile = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile.meta.path]: mapFile,
      },
    });

    const result = resolvePlaygroundMapFile(
      map,
      "non-existent-id" as PlaygroundMap.FileId,
    );
    expect(result).toBeNull();
  });
});

describe(resolvePlaygroundMapPair, () => {
  it("resolves map pair by ref", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts1 = parsedPrompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_F_SOURCE,
        prompt,
      }),
    );
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = TEST_FILE_E_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_E_SOURCE,
        prompt,
      }),
    );
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

    const ref: PlaygroundState.Ref = {
      v: 1,
      type: "code",
      fileId: mapFile1.id,
      promptId: mapPrompts1[0]!.id,
    };
    const result = resolvePlaygroundMapPair(map, ref);
    expect(result).toEqual([mapFile1, mapPrompts1[0]]);
  });

  it("returns null when map prompt id does not exist", () => {
    const mapPrompts = TEST_FILE_F_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_F_SOURCE,
        prompt,
      }),
    );
    const mapFile = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts,
    });

    const map = playgroundMapFactory({ files: {} });

    const ref: PlaygroundState.Ref = {
      v: 1,
      type: "code",
      fileId: mapFile.id,
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
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts1 = parsedPrompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_F_SOURCE,
        prompt,
      }),
    );
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = TEST_FILE_E_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_E_SOURCE,
        prompt,
      }),
    );
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

    const file = editorFileFactory({
      path: "/wrkspc/one.ts" as EditorFile.Path,
    });

    const result = resolvePlaygroundMap({
      source: TEST_FILE_F_SOURCE,
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(result).toBe(map);
  });

  it("adds a new file if nothing matched", () => {
    const parsedPrompts = TEST_FILE_D_PARSED_RESULT.prompts;

    const mapPrompts = TEST_FILE_A_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_A_SOURCE,
        prompt,
      }),
    );
    const mapFile = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile.meta.path]: mapFile,
      },
    });

    const timestamp = 1234567890;

    const file = editorFileFactory({
      path: "/wrkspc/three.ts" as EditorFile.Path,
    });

    const result = resolvePlaygroundMap({
      source: TEST_FILE_D_SOURCE,
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(result).toMatchObject({
      files: {
        [mapFile.meta.path]: mapFile,
        [file.path]: expect.objectContaining({
          id: expect.any(String),
          updatedAt: timestamp,
          meta: editorFileToMeta(file),
          prompts: [
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ id: expect.any(String) }),
            expect.objectContaining({ id: expect.any(String) }),
          ],
        }),
      },
    });
  });

  it("updates existing file when prompts have changed", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts1 = TEST_FILE_A_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_A_SOURCE,
        prompt,
      }),
    );
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = TEST_FILE_E_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_E_SOURCE,
        prompt,
      }),
    );
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

    const file = editorFileFactory({
      path: "/wrkspc/one.ts" as EditorFile.Path,
    });

    const result = resolvePlaygroundMap({
      source: TEST_FILE_F_SOURCE,
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(result).toMatchObject({
      files: {
        [file.path]: expect.objectContaining({
          id: mapFile1.id,
          updatedAt: timestamp,
          meta: editorFileToMeta(file),
          prompts: [
            expect.objectContaining({ id: mapPrompts1[0]!.id }),
            expect.objectContaining({ id: mapPrompts1[1]!.id }),
            expect.objectContaining({ id: expect.any(String) }),
          ],
        }),
        [mapFile2.meta.path]: mapFile2,
      },
    });
  });
});

describe(matchPlaygroundMapFile, () => {
  it("returns file when it not changed", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts1 = parsedPrompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_F_SOURCE,
        prompt,
      }),
    );
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = TEST_FILE_E_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_E_SOURCE,
        prompt,
      }),
    );
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

    const file = editorFileFactory({
      path: "/wrkspc/one.ts" as EditorFile.Path,
    });

    const match = matchPlaygroundMapFile({
      source: TEST_FILE_F_SOURCE,
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: mapFile1,
      matchedPromptsScore: 1,
      matchingDistance: 1,
      matchedCount: 3,
      changed: false,
    });
  });

  it("returns updated file when path matches the map entry", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts1 = TEST_FILE_A_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_A_SOURCE,
        prompt,
      }),
    );
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = TEST_FILE_E_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_E_SOURCE,
        prompt,
      }),
    );
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

    const file = editorFileFactory({
      path: "/wrkspc/one.ts" as EditorFile.Path,
    });

    const match = matchPlaygroundMapFile({
      source: TEST_FILE_F_SOURCE,
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: expect.objectContaining({
        id: mapFile1.id,
        updatedAt: timestamp,
        meta: editorFileToMeta(file),
        prompts: [
          expect.objectContaining({ id: mapPrompts1[0]!.id }),
          expect.objectContaining({ id: mapPrompts1[1]!.id }),
          expect.objectContaining({ id: expect.any(String) }),
        ],
      }),
      matchedPromptsScore: 1,
      matchingDistance: 1,
      matchedCount: 2,
      changed: true,
    });
  });

  it("falls back to distance matching when path differs", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts1 = TEST_FILE_A_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_A_SOURCE,
        prompt,
      }),
    );
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = TEST_FILE_E_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_E_SOURCE,
        prompt,
      }),
    );
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

    const file = editorFileFactory({
      path: "/wrkspc/zero.ts" as EditorFile.Path,
    });

    const match = matchPlaygroundMapFile({
      source: TEST_FILE_F_SOURCE,
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: expect.objectContaining({
        id: mapFile1.id,
        updatedAt: timestamp,
        meta: editorFileToMeta(file),
        prompts: [
          expect.objectContaining({
            id: mapPrompts1[0]!.id,
          }),
          expect.objectContaining({
            id: mapPrompts1[1]!.id,
          }),
          expect.objectContaining({
            id: expect.any(String),
          }),
        ],
      }),
      matchedPromptsScore: 1,
      matchingDistance: 1,
      matchedCount: 2,
      changed: true,
    });
  });

  it("falls back to distance matching when content differs", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts1 = TEST_FILE_A_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_A_SOURCE,
        prompt,
      }),
    );
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = TEST_FILE_E_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_E_SOURCE,
        prompt,
      }),
    );
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

    const file = editorFileFactory({
      path: "/wrkspc/two.ts" as EditorFile.Path,
    });

    const match = matchPlaygroundMapFile({
      source: TEST_FILE_F_SOURCE,
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: expect.objectContaining({
        id: mapFile2.id,
        updatedAt: timestamp,
        meta: editorFileToMeta(file),
        prompts: [
          expect.objectContaining({
            id: mapPrompts2[1]!.id,
          }),
          expect.objectContaining({
            id: expect.any(String),
          }),
          expect.objectContaining({
            id: mapPrompts2[0]!.id,
          }),
        ],
      }),
      matchedPromptsScore: 1,
      matchingDistance: expect.closeTo(0.588),
      matchedCount: 2,
      changed: true,
    });
  });

  it("returns new map file if no match found", () => {
    const parsedPrompts = TEST_FILE_D_PARSED_RESULT.prompts;

    const mapPrompts = TEST_FILE_A_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_A_SOURCE,
        prompt,
      }),
    );
    const mapFile = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile.meta.path]: mapFile,
      },
    });

    const timestamp = 1234567890;

    const file = editorFileFactory({
      path: "/wrkspc/three.ts" as EditorFile.Path,
    });

    const match = matchPlaygroundMapFile({
      source: TEST_FILE_F_SOURCE,
      timestamp,
      map,
      file,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: expect.objectContaining({
        id: expect.any(String),
        updatedAt: timestamp,
        meta: editorFileToMeta(file),
        prompts: [
          expect.objectContaining({ id: expect.any(String) }),
          expect.objectContaining({ id: expect.any(String) }),
          expect.objectContaining({ id: expect.any(String) }),
          expect.objectContaining({ id: expect.any(String) }),
          expect.objectContaining({ id: expect.any(String) }),
          expect.objectContaining({ id: expect.any(String) }),
          expect.objectContaining({ id: expect.any(String) }),
          expect.objectContaining({ id: expect.any(String) }),
          expect.objectContaining({ id: expect.any(String) }),
        ],
      }),
      matchedPromptsScore: 0,
      matchingDistance: 0,
      matchedCount: 0,
      changed: true,
    });
  });

  it("clones file matched by path", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts = TEST_FILE_A_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_A_SOURCE,
        prompt,
      }),
    );
    const mapFile = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile.meta.path]: mapFile,
      },
    });

    const file = editorFileFactory({
      path: "/wrkspc/three.ts" as EditorFile.Path,
    });

    const match = matchPlaygroundMapFile({
      source: TEST_FILE_F_SOURCE,
      timestamp: Date.now(),
      map,
      file,
      parsedPrompts,
    });

    expect(match).not.toBe(mapFile);
  });
});

describe(matchPlaygroundMapFileByDistance, () => {
  it("returns best scoring file above threshold with updated prompts", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts1 = TEST_FILE_A_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_A_SOURCE,
        prompt,
      }),
    );
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = TEST_FILE_E_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_E_SOURCE,
        prompt,
      }),
    );
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
      source: TEST_FILE_F_SOURCE,
      timestamp,
      file,
      map,
      parsedPrompts,
    });

    expect(match).toEqual({
      mapFile: {
        v: 1,
        id: mapFile1.id,
        updatedAt: timestamp,
        meta: editorFileToMeta(file),
        prompts: [
          expect.objectContaining({
            id: mapPrompts1[0]!.id,
          }),
          expect.objectContaining({
            id: mapPrompts1[1]!.id,
          }),
          expect.objectContaining({
            id: expect.any(String),
          }),
        ],
      },
      matchedPromptsScore: 1,
      matchingDistance: 1,
      matchedCount: 2,
      changed: true,
    });
  });

  it("returns null if no matching prompts are found", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts = TEST_FILE_D_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_D_SOURCE,
        prompt,
      }),
    );
    const mapFile = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile.meta.path]: mapFile,
      },
    });

    const timestamp = 1234567890;
    const file = editorFileFactory();

    const match = matchPlaygroundMapFileByDistance({
      source: TEST_FILE_F_SOURCE,
      timestamp,
      file,
      map,
      parsedPrompts,
    });

    expect(match).toBe(null);
  });

  it("preserves updatedAt if nothing has changed", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts1 = parsedPrompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_F_SOURCE,
        prompt,
      }),
    );
    const mapFile1 = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts1,
    });

    const mapPrompts2 = TEST_FILE_E_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_E_SOURCE,
        prompt,
      }),
    );
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
    const file = editorFileFactory({
      path: mapFile1.meta.path,
    });

    const match = matchPlaygroundMapFileByDistance({
      source: TEST_FILE_F_SOURCE,
      timestamp,
      file,
      map,
      parsedPrompts,
    });

    expect(match).toMatchObject({
      mapFile: expect.objectContaining({
        id: mapFile1.id,
        updatedAt: mapFile1.updatedAt,
        prompts: [
          expect.objectContaining({
            id: mapPrompts1[0]!.id,
          }),
          expect.objectContaining({
            id: mapPrompts1[1]!.id,
          }),
          expect.objectContaining({
            id: mapPrompts1[2]!.id,
          }),
        ],
      }),
      changed: false,
    });
  });

  it("clones matched file", () => {
    const parsedPrompts = TEST_FILE_F_PARSED_RESULT.prompts;

    const mapPrompts = parsedPrompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_F_SOURCE,
        prompt,
      }),
    );
    const mapFile = playgroundMapFileFactory({
      meta: editorFileMetaFactory({
        path: editorFilePathFactory("/wrkspc/one.ts"),
      }),
      prompts: mapPrompts,
    });

    const map = playgroundMapFactory({
      files: {
        [mapFile.meta.path]: mapFile,
      },
    });

    const file = editorFileFactory({
      path: mapFile.meta.path,
    });

    const match = matchPlaygroundMapFileByDistance({
      source: TEST_FILE_F_SOURCE,
      file,
      timestamp: Date.now(),
      map,
      parsedPrompts,
    });
    expect(match?.mapFile).not.toBe(mapFile);
    expect(match?.mapFile.meta).not.toBe(mapFile.meta);
    expect(match?.mapFile.prompts).not.toBe(mapFile.prompts);
  });
});

//#endregion

//#region Map prompts

describe(matchPlaygroundMapPrompts, () => {
  it("preserves matched prompt ids and inserts new prompts in parsed order", () => {
    const lambdaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[7];
    const betaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[5];

    const mapPromptDeltaLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[9],
    });
    const mapPromptDeltaLegacy =
      playgroundMapPromptCodeV2ToV1(mapPromptDeltaLatest);

    const mapPromptBetaLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[0],
    });
    const mapPromptBetaLegacy =
      playgroundMapPromptCodeV2ToV1(mapPromptBetaLatest);

    const mapPromptsVersions: [
      PlaygroundMap.PromptCode,
      PlaygroundMap.PromptCode,
    ][] = [
      [mapPromptDeltaLegacy, mapPromptBetaLegacy],
      [mapPromptDeltaLatest, mapPromptBetaLatest],
    ];

    for (const [deltaMapPrompt, betaMapPrompt] of mapPromptsVersions) {
      const result = matchPlaygroundMapPrompts({
        source: TEST_FILE_C_SOURCE,
        timestamp: Date.now(),
        mapPrompts: [betaMapPrompt, deltaMapPrompt],
        parsedPrompts: [lambdaParsedPrompt, betaParsedPrompt],
      });

      expect(result).toMatchObject({
        nextMapPrompts: [
          expect.objectContaining({ id: betaMapPrompt.id }),
          expect.objectContaining({ id: deltaMapPrompt.id }),
        ],
        changed: true,
        matchedPromptsScore: 1,
        matchingDistance: expect.closeTo(0.433),
        matchedCount: 2,
      });
    }
  });

  it("returns changed: false if all prompts matched by content", () => {
    const nuPrompt = TEST_FILE_C_PARSED_RESULT.prompts[9];

    const deltaMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[0],
    });
    const deltaMapPromptLegacy =
      playgroundMapPromptCodeV2ToV1(deltaMapPromptLatest);

    const mapPromptsVersions: PlaygroundMap.PromptCode[] = [
      deltaMapPromptLegacy,
      deltaMapPromptLatest,
    ];

    for (const mapPrompt of mapPromptsVersions) {
      const result = matchPlaygroundMapPrompts({
        source: TEST_FILE_C_SOURCE,
        timestamp: Date.now(),
        mapPrompts: [mapPrompt],
        parsedPrompts: [nuPrompt],
      });

      expect(result.changed).toBe(false);
    }
  });

  it("returns changed: true if order has changed", () => {
    const deltaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[0];
    const epsilonParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[1];

    const mapPromptDeltaLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[9],
    });
    const mapPromptDeltaLegacy =
      playgroundMapPromptCodeV2ToV1(mapPromptDeltaLatest);

    const mapPromptEpsilonLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[10],
    });
    const mapPromptEpsilonLegacy = playgroundMapPromptCodeV2ToV1(
      mapPromptEpsilonLatest,
    );

    const mapPromptsVersions: PlaygroundMap.PromptCode[][] = [
      [mapPromptDeltaLegacy, mapPromptEpsilonLegacy],
      [mapPromptDeltaLatest, mapPromptEpsilonLatest],
    ];

    for (const mapPrompts of mapPromptsVersions) {
      const result = matchPlaygroundMapPrompts({
        source: TEST_FILE_C_SOURCE,
        timestamp: Date.now(),
        mapPrompts: mapPrompts,
        parsedPrompts: [epsilonParsedPrompt, deltaParsedPrompt],
      });

      expect(result.changed).toBe(true);
    }
  });

  it("returns changed: true if content has changed", () => {
    const etaPrompt = TEST_FILE_C_PARSED_RESULT.prompts[3];

    const deltaMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[0],
    });
    const deltaMapPromptLegacy =
      playgroundMapPromptCodeV2ToV1(deltaMapPromptLatest);

    const mapPromptsVersions: PlaygroundMap.PromptCode[] = [
      deltaMapPromptLegacy,
      deltaMapPromptLatest,
    ];

    for (const mapPrompt of mapPromptsVersions) {
      const result = matchPlaygroundMapPrompts({
        source: TEST_FILE_C_SOURCE,
        timestamp: Date.now(),
        mapPrompts: [mapPrompt],
        parsedPrompts: [etaPrompt],
      });

      expect(result.changed).toBe(true);
    }
  });

  it("returns changed: true if new prompts are added", () => {
    const deltaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[0];
    const epsilonParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[1];
    const zetaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[2];

    const mapPromptDeltaLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[9],
    });
    const mapPromptDeltaLegacy =
      playgroundMapPromptCodeV2ToV1(mapPromptDeltaLatest);

    const mapPromptEpsilonLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[10],
    });
    const mapPromptEpsilonLegacy = playgroundMapPromptCodeV2ToV1(
      mapPromptEpsilonLatest,
    );

    const mapPromptsVersions: PlaygroundMap.PromptCode[][] = [
      [mapPromptDeltaLegacy, mapPromptEpsilonLegacy],
      [mapPromptDeltaLatest, mapPromptEpsilonLatest],
    ];

    for (const mapPrompts of mapPromptsVersions) {
      const result = matchPlaygroundMapPrompts({
        source: TEST_FILE_C_SOURCE,
        timestamp: Date.now(),
        mapPrompts: mapPrompts,
        parsedPrompts: [
          deltaParsedPrompt,
          epsilonParsedPrompt,
          zetaParsedPrompt,
        ],
      });

      expect(result.changed).toBe(true);
    }
  });

  it("does not mutate original map prompts", () => {
    const mapPrompts = TEST_FILE_A_PARSED_RESULT.prompts.map((prompt) =>
      toPlaygroundMapPrompt({ source: TEST_FILE_A_SOURCE, prompt }),
    );
    const parsedPrompts = [] as const;

    const result = matchPlaygroundMapPrompts({
      source: "",
      timestamp: Date.now(),
      mapPrompts,
      parsedPrompts,
    });

    expect(result.nextMapPrompts).not.toBe(mapPrompts);
  });

  it("clones existing map prompts", () => {
    const parsedPrompts = TEST_FILE_A_PARSED_RESULT.prompts;
    const mapPrompts = parsedPrompts.map((prompt) =>
      toPlaygroundMapPrompt({
        source: TEST_FILE_A_SOURCE,
        prompt,
      }),
    );

    const result = matchPlaygroundMapPrompts({
      source: TEST_FILE_A_SOURCE,
      timestamp: Date.now(),
      mapPrompts,
      parsedPrompts,
    });

    expect(result.nextMapPrompts[0]).not.toBe(mapPrompts[0]);
    expect(result.nextMapPrompts[1]).not.toBe(mapPrompts[1]);
  });
});

describe(matchPlaygroundMapPromptsByContent, () => {
  it("matches prompts with identical content", () => {
    const deltaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[0];
    const gammaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[1];

    const nuMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[9],
    });
    const nuMapPromptLegacy = playgroundMapPromptCodeV2ToV1(nuMapPromptLatest);

    const xiMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[10],
    });
    const xiMapPromptLegacy = playgroundMapPromptCodeV2ToV1(xiMapPromptLatest);

    const originalMapPromptVersions: [
      PlaygroundMap.PromptCode,
      PlaygroundMap.PromptCode,
    ][] = [
      [nuMapPromptLegacy, xiMapPromptLegacy],
      [nuMapPromptLatest, xiMapPromptLatest],
    ];

    for (const mapPrompts of originalMapPromptVersions) {
      const result = matchPlaygroundMapPromptsByContent({
        source: TEST_FILE_C_SOURCE,
        unmatchedMapPrompts: new Set(mapPrompts),
        unmatchedParsedPrompts: new Set([deltaParsedPrompt, gammaParsedPrompt]),
      });

      const matchedMapPrompts = new Map();
      matchedMapPrompts.set(
        deltaParsedPrompt,
        expect.objectContaining({
          id: mapPrompts[0].id,
          span: playgroundMapSpanFromPrompt(deltaParsedPrompt),
        }),
      );
      matchedMapPrompts.set(
        gammaParsedPrompt,
        expect.objectContaining({
          id: mapPrompts[1].id,
          span: playgroundMapSpanFromPrompt(gammaParsedPrompt),
        }),
      );

      const matchingDistances = new Map();
      matchingDistances.set(mapPrompts[0], 1);
      matchingDistances.set(mapPrompts[1], 1);

      expect(result).toEqual({
        matchedMapPrompts,
        unmatchedParsedPrompts: new Set(),
        unmatchedMapPrompts: new Set(),
        matchingDistances,
      });
    }
  });

  it("matches prompt vars for matched prompts", () => {
    const deltaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[0];
    const gammaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[1];

    const nuMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[9],
    });
    const nuMapPromptLegacy = playgroundMapPromptCodeV2ToV1(nuMapPromptLatest);

    const xiMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[10],
    });
    const xiMapPromptLegacy = playgroundMapPromptCodeV2ToV1(xiMapPromptLatest);

    const originalMapPromptVersions: [
      PlaygroundMap.PromptCode,
      PlaygroundMap.PromptCode,
    ][] = [
      [nuMapPromptLegacy, xiMapPromptLegacy],
      [nuMapPromptLatest, xiMapPromptLatest],
    ];

    for (const mapPrompts of originalMapPromptVersions) {
      const result = matchPlaygroundMapPromptsByContent({
        source: TEST_FILE_C_SOURCE,
        unmatchedMapPrompts: new Set(mapPrompts),
        unmatchedParsedPrompts: new Set([deltaParsedPrompt, gammaParsedPrompt]),
      });

      const matchedMapPrompts = new Map();
      matchedMapPrompts.set(
        deltaParsedPrompt,
        expect.objectContaining({
          vars: [
            expect.objectContaining({ id: mapPrompts[0].vars[0]!.id }),
            expect.objectContaining({ id: mapPrompts[0].vars[1]!.id }),
            expect.objectContaining({ id: mapPrompts[0].vars[2]!.id }),
          ],
        }),
      );
      matchedMapPrompts.set(
        gammaParsedPrompt,
        expect.objectContaining({
          vars: [
            expect.objectContaining({ id: mapPrompts[1].vars[0]!.id }),
            expect.objectContaining({ id: mapPrompts[1].vars[1]!.id }),
            expect.objectContaining({ id: mapPrompts[1].vars[2]!.id }),
          ],
        }),
      );

      expect(result.matchedMapPrompts).toEqual(matchedMapPrompts);
    }
  });

  it("clones argument sets", () => {
    const unmatchedParsedPrompts = new Set<any>();
    const unmatchedMapPrompts = new Set<any>();

    const result = matchPlaygroundMapPromptsByContent({
      source: "",
      unmatchedParsedPrompts,
      unmatchedMapPrompts,
    });

    expect(result.unmatchedMapPrompts).not.toBe(unmatchedMapPrompts);
    expect(result.unmatchedParsedPrompts).not.toBe(unmatchedParsedPrompts);
  });
});

describe(matchPlaygroundMapPromptsByDistance, () => {
  it("matches prompts within Levenshtein threshold", () => {
    const matchingParsedPrompts = TEST_FILE_D_PARSED_RESULT.prompts.slice(3, 6);

    const originalMapPromptsLatest = TEST_FILE_D_PARSED_RESULT.prompts
      .slice(0, 3)
      .map((prompt) =>
        toPlaygroundMapPrompt({ source: TEST_FILE_D_SOURCE, prompt }),
      );

    const originalMapPromptsLegacy = originalMapPromptsLatest.map(
      playgroundMapPromptCodeV2ToV1,
    );

    const originalMapPromptVersions: [
      PlaygroundMap.PromptCode[],
      PlaygroundMap.PromptCode[],
    ] = [originalMapPromptsLegacy, originalMapPromptsLatest];

    for (const mapPrompts of originalMapPromptVersions) {
      const result = matchPlaygroundMapPromptsByDistance({
        source: TEST_FILE_D_SOURCE,
        timestamp: Date.now(),
        unmatchedMapPrompts: new Set(mapPrompts),
        unmatchedParsedPrompts: new Set(matchingParsedPrompts),
      });

      const matchedMapPrompts = new Map();
      matchedMapPrompts.set(
        matchingParsedPrompts[0],
        expect.objectContaining({ id: mapPrompts[0]!.id }),
      );
      matchedMapPrompts.set(
        matchingParsedPrompts[1],
        expect.objectContaining({ id: mapPrompts[1]!.id }),
      );
      matchedMapPrompts.set(
        matchingParsedPrompts[2],
        expect.objectContaining({ id: mapPrompts[2]!.id }),
      );

      expect(result).toEqual({
        matchedMapPrompts,
        unmatchedParsedPrompts: new Set([]),
        unmatchedMapPrompts: new Set([]),
        matchingDistances: expect.any(Object),
      });

      expect([...result.matchingDistances.values()]).toEqual([
        expect.closeTo(0.26),
        expect.closeTo(0.425),
        expect.closeTo(0.545),
      ]);
    }
  });

  it("returns nothing when matches does not pass threshold", () => {
    const distinctParsedPrompts = TEST_FILE_D_PARSED_RESULT.prompts.slice(6, 9);

    const originalMapPromptsLatest = TEST_FILE_D_PARSED_RESULT.prompts
      .slice(0, 3)
      .map((prompt) =>
        toPlaygroundMapPrompt({ source: TEST_FILE_D_SOURCE, prompt }),
      );

    const originalMapPromptsLegacy = originalMapPromptsLatest.map(
      playgroundMapPromptCodeV2ToV1,
    );

    const originalMapPromptVersions: PlaygroundMap.PromptCode[][] = [
      originalMapPromptsLegacy,
      originalMapPromptsLatest,
    ];

    for (const mapPrompts of originalMapPromptVersions) {
      const result = matchPlaygroundMapPromptsByDistance({
        source: TEST_FILE_D_SOURCE,
        timestamp: Date.now(),
        unmatchedMapPrompts: new Set(mapPrompts),
        unmatchedParsedPrompts: new Set(distinctParsedPrompts),
      });

      expect(result.matchedMapPrompts.size).toEqual(0);
    }
  });

  it("matches prompt vars for matched prompts", () => {
    const etaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[3];

    const deltaMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[0],
    });

    const deltaMapPromptLegacy =
      playgroundMapPromptCodeV2ToV1(deltaMapPromptLatest);

    const originalMapPromptVersions: PlaygroundMap.PromptCode[] = [
      deltaMapPromptLatest,
      deltaMapPromptLegacy,
    ];

    for (const mapPrompt of originalMapPromptVersions) {
      const result = matchPlaygroundMapPromptsByDistance({
        source: TEST_FILE_C_SOURCE,
        timestamp: Date.now(),
        unmatchedMapPrompts: new Set([mapPrompt]),
        unmatchedParsedPrompts: new Set([etaParsedPrompt]),
      });

      const matchedMapPrompts = new Map();
      matchedMapPrompts.set(
        etaParsedPrompt,
        expect.objectContaining({
          span: playgroundMapSpanFromPrompt(etaParsedPrompt),
          vars: [
            expect.objectContaining({ id: mapPrompt.vars[0]!.id }),
            expect.objectContaining({ id: mapPrompt.vars[1]!.id }),
            expect.objectContaining({ id: mapPrompt.vars[2]!.id }),
          ],
        }),
      );

      expect(result.matchedMapPrompts).toEqual(matchedMapPrompts);
    }
  });

  it("assigns current timestamp to updated prompts", () => {
    const etaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[3];

    const deltaMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[0],
    });

    const deltaMapPromptLegacy =
      playgroundMapPromptCodeV2ToV1(deltaMapPromptLatest);

    const originalMapPromptVersions: PlaygroundMap.PromptCode[] = [
      deltaMapPromptLatest,
      deltaMapPromptLegacy,
    ];

    const timestamp = 1234567890;

    for (const mapPrompt of originalMapPromptVersions) {
      const result = matchPlaygroundMapPromptsByDistance({
        source: TEST_FILE_C_SOURCE,
        timestamp,
        unmatchedMapPrompts: new Set([mapPrompt]),
        unmatchedParsedPrompts: new Set([etaParsedPrompt]),
      });

      const matchedMapPrompts = new Map();
      matchedMapPrompts.set(
        etaParsedPrompt,
        expect.objectContaining({ updatedAt: timestamp }),
      );

      expect(result.matchedMapPrompts).toEqual(matchedMapPrompts);
    }
  });

  it("clones argument sets", () => {
    const unmatchedMapPrompts = new Set([]);
    const unmatchedParsedPrompts = new Set([]);

    const result = matchPlaygroundMapPromptsByDistance({
      source: "",
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
    const thetaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[4];

    const deltaMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[0],
    });
    const alphaMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_A_SOURCE,
      prompt: TEST_FILE_A_PARSED_RESULT.prompts[0],
    });

    const deltaMapPromptLegacy =
      playgroundMapPromptCodeV2ToV1(deltaMapPromptLatest);
    const alphaMapPromptLegacy =
      playgroundMapPromptCodeV2ToV1(alphaMapPromptLatest);

    const mapPromptVersions: [
      PlaygroundMap.PromptCode,
      PlaygroundMap.PromptCode,
    ][] = [
      [deltaMapPromptLegacy, alphaMapPromptLegacy],
      [deltaMapPromptLatest, alphaMapPromptLatest],
    ];

    for (const [deltaMapPrompt, alphaMapPrompt] of mapPromptVersions) {
      const matchedMapPrompts = new Map();
      matchedMapPrompts.set(thetaParsedPrompt, deltaMapPrompt);

      const score = calcMatchedPromptsScore({
        matchedMapPrompts,
        unmatchedMapPrompts: new Set([alphaMapPrompt]),
      });

      expect(score).toBeCloseTo(0.5);
    }
  });

  it("returns 1 when all prompts matched", () => {
    const thetaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[4];
    const kappaPromptParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[5];

    const deltaMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[0],
    });
    const etaMapPromptLatest = toPlaygroundMapPrompt({
      source: TEST_FILE_C_SOURCE,
      prompt: TEST_FILE_C_PARSED_RESULT.prompts[3],
    });

    const deltaMapPromptLegacy =
      playgroundMapPromptCodeV2ToV1(deltaMapPromptLatest);
    const alphaMapPromptLegacy =
      playgroundMapPromptCodeV2ToV1(etaMapPromptLatest);

    const mapPromptVersions: [
      PlaygroundMap.PromptCode,
      PlaygroundMap.PromptCode,
    ][] = [
      [deltaMapPromptLegacy, alphaMapPromptLegacy],
      [deltaMapPromptLatest, etaMapPromptLatest],
    ];

    for (const [deltaMapPrompt, etaMapPrompt] of mapPromptVersions) {
      const matchedMapPrompts = new Map();
      matchedMapPrompts.set(thetaParsedPrompt, deltaMapPrompt);
      matchedMapPrompts.set(kappaPromptParsedPrompt, etaMapPrompt);

      const score = calcMatchedPromptsScore({
        matchedMapPrompts,
        unmatchedMapPrompts: new Set([]),
      });

      expect(score).toBe(1);
    }
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

//#region Map prompt vars

describe(matchPlaygroundMapPromptVars, () => {
  it("preserves matched prompt var ids and inserts new prompt vars in parsed order", () => {
    const lambdaParsedPromptVars = TEST_FILE_C_PARSED_RESULT.prompts[7].vars;
    const lambdaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[7],
    );

    const deltaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[0],
    );

    const deltaMapPromptVarsLegacy = deltaMapPromptVarsLatest.map(
      playgroundMapPromptVarV2ToV1,
    );

    const mapPromptVarsVersions: PlaygroundMap.PromptVar[][] = [
      deltaMapPromptVarsLegacy,
      deltaMapPromptVarsLatest,
    ];

    for (const mapPromptVars of mapPromptVarsVersions) {
      const result = matchPlaygroundMapPromptVars({
        source: TEST_FILE_C_SOURCE,
        mapPromptVars,
        parsedPromptVars: lambdaParsedPromptVars,
      });

      expect(result).toEqual({
        nextMapPromptVars: [
          {
            ...lambdaMapPromptVarsLatest[0],
            id: expect.any(String),
          },
          {
            ...lambdaMapPromptVarsLatest[1],
            id: mapPromptVars[0]!.id,
          },
          {
            ...lambdaMapPromptVarsLatest[2],
            id: mapPromptVars[1]!.id,
          },
          {
            ...lambdaMapPromptVarsLatest[3],
            id: mapPromptVars[2]!.id,
          },
        ],
      });
    }
  });

  it("assigns same ids to multiple added vars with same expressions", () => {
    const muParsedPromptVars = TEST_FILE_C_PARSED_RESULT.prompts[8].vars;
    const muMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[8],
    );

    const deltaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[0],
    );

    const deltaMapPromptVarsLegacy = deltaMapPromptVarsLatest.map(
      playgroundMapPromptVarV2ToV1,
    );

    const mapPromptVarsVersions: PlaygroundMap.PromptVar[][] = [
      deltaMapPromptVarsLegacy,
      deltaMapPromptVarsLatest,
    ];

    for (const mapPromptVars of mapPromptVarsVersions) {
      const result = matchPlaygroundMapPromptVars({
        source: TEST_FILE_C_SOURCE,
        mapPromptVars,
        parsedPromptVars: muParsedPromptVars,
      });

      expect(result).toEqual({
        nextMapPromptVars: [
          {
            ...muMapPromptVarsLatest[0],
            id: mapPromptVars[0]!.id,
          },
          {
            ...muMapPromptVarsLatest[1],
            id: mapPromptVars[1]!.id,
          },
          {
            ...muMapPromptVarsLatest[2],
            id: mapPromptVars[2]!.id,
          },
          {
            ...muMapPromptVarsLatest[3],
            id: mapPromptVars[0]!.id,
          },
        ],
      });
    }
  });

  it("clones argument arrays", () => {
    const mapPromptVars: PlaygroundMap.PromptVar[] = [];
    const parsedPromptVars: PromptVar[] = [];

    const result = matchPlaygroundMapPromptVars({
      source: "",
      mapPromptVars,
      parsedPromptVars,
    });

    expect(result.nextMapPromptVars).not.toBe(mapPromptVars);
  });
});

describe(matchPlaygroundMapPromptVarsByContent, () => {
  it("matches vars with identical expressions", () => {
    const deltaParsedPromptVars = TEST_FILE_C_PARSED_RESULT.prompts[0].vars;
    const deltaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[0],
    );

    const epsilonMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[1],
    );

    const epsilonMapPromptVarsLegacy = epsilonMapPromptVarsLatest.map(
      playgroundMapPromptVarV2ToV1,
    );

    const mapPromptVarsVersions: PlaygroundMap.PromptVar[][] = [
      epsilonMapPromptVarsLegacy,
      epsilonMapPromptVarsLatest,
    ];

    for (const mapPromptVars of mapPromptVarsVersions) {
      const result = matchPlaygroundMapPromptVarsByContent({
        source: TEST_FILE_C_SOURCE,
        matchedMapPromptVarExps: {},
        unmatchedMapPromptVars: new Set(mapPromptVars),
        unmatchedParsedPromptVars: new Set(deltaParsedPromptVars),
      });

      const matchedMapPromptVars = new Map();
      matchedMapPromptVars.set(deltaParsedPromptVars[0], {
        ...epsilonMapPromptVarsLatest[1],
        span: deltaMapPromptVarsLatest[0]!.span,
      });
      matchedMapPromptVars.set(deltaParsedPromptVars[2], {
        ...epsilonMapPromptVarsLatest[0],
        span: deltaMapPromptVarsLatest[2]!.span,
      });

      expect(result).toEqual({
        matchedMapPromptVars,
        matchedMapPromptVarExps: {
          "${five}": mapPromptVars[1]!.id,
          "${seven}": mapPromptVars[0]!.id,
        },
        unmatchedParsedPromptVars: new Set([deltaParsedPromptVars[1]]),
        unmatchedMapPromptVars: new Set([mapPromptVars[2]]),
      });
    }
  });

  it("assigns same ids to multiple vars with same expressions", () => {
    const zetaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[2];
    const zetaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      zetaParsedPrompt,
    );

    const zetaMapPromptVarsLegacy = zetaMapPromptVarsLatest.map(
      playgroundMapPromptVarV2ToV1,
    );

    const mapPromptVarsVersions: PlaygroundMap.PromptVar[][] = [
      zetaMapPromptVarsLegacy,
      zetaMapPromptVarsLatest,
    ];

    const varFiveId = buildMapPromptVarId();

    for (const mapPromptVars of mapPromptVarsVersions) {
      const result = matchPlaygroundMapPromptVarsByContent({
        source: TEST_FILE_C_SOURCE,
        matchedMapPromptVarExps: { "${five}": varFiveId },
        unmatchedMapPromptVars: new Set(mapPromptVars),
        unmatchedParsedPromptVars: new Set(zetaParsedPrompt.vars),
      });

      const matchedMapPromptVars = new Map<
        PromptVar,
        PlaygroundMap.PromptVar
      >();
      matchedMapPromptVars.set(
        zetaParsedPrompt.vars[0],
        expect.objectContaining({
          id: varFiveId,
          span: zetaMapPromptVarsLatest[0]!.span,
        }),
      );
      matchedMapPromptVars.set(
        zetaParsedPrompt.vars[1],
        expect.objectContaining({
          id: varFiveId,
          span: zetaMapPromptVarsLatest[1]!.span,
        }),
      );
      matchedMapPromptVars.set(
        zetaParsedPrompt.vars[2],
        expect.objectContaining({
          id: varFiveId,
          span: zetaMapPromptVarsLatest[2]!.span,
        }),
      );

      expect(result).toEqual({
        matchedMapPromptVars,
        matchedMapPromptVarExps: {
          "${five}": varFiveId,
        },
        unmatchedParsedPromptVars: new Set(),
        unmatchedMapPromptVars: new Set(),
      });
    }
  });

  it("assigns latest spans", () => {
    const deltaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[0];
    const etaParsedPrompt = TEST_FILE_C_PARSED_RESULT.prompts[3];
    const etaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      etaParsedPrompt,
    );

    const etaMapPromptVarsLegacy = etaMapPromptVarsLatest.map(
      playgroundMapPromptVarV2ToV1,
    );

    const mapPromptVarsVersions: PlaygroundMap.PromptVar[][] = [
      etaMapPromptVarsLegacy,
      etaMapPromptVarsLatest,
    ];

    for (const mapPromptVars of mapPromptVarsVersions) {
      const result = matchPlaygroundMapPromptVarsByContent({
        source: TEST_FILE_C_SOURCE,
        matchedMapPromptVarExps: {},
        unmatchedMapPromptVars: new Set(mapPromptVars),
        unmatchedParsedPromptVars: new Set(deltaParsedPrompt.vars),
      });

      const matchedMapPromptVars = new Map<
        PromptVar,
        PlaygroundMap.PromptVar
      >();
      matchedMapPromptVars.set(
        deltaParsedPrompt.vars[0],
        expect.objectContaining({
          id: etaMapPromptVarsLatest[0]!.id,
          span: { v: 2, ...deltaParsedPrompt.vars[0].span },
        }),
      );
      matchedMapPromptVars.set(
        deltaParsedPrompt.vars[1],
        expect.objectContaining({
          id: etaMapPromptVarsLatest[1]!.id,
          span: { v: 2, ...deltaParsedPrompt.vars[1].span },
        }),
      );
      matchedMapPromptVars.set(
        deltaParsedPrompt.vars[2],
        expect.objectContaining({
          id: etaMapPromptVarsLatest[2]!.id,
          span: { v: 2, ...deltaParsedPrompt.vars[2].span },
        }),
      );

      expect(result.matchedMapPromptVars).toEqual(matchedMapPromptVars);
    }
  });

  it("clones argument sets", () => {
    const matchedMapPromptVarExps = {};
    const unmatchedMapPromptVars = new Set<any>();
    const unmatchedParsedPromptVars = new Set<any>();

    const result = matchPlaygroundMapPromptVarsByContent({
      source: "",
      matchedMapPromptVarExps,
      unmatchedMapPromptVars,
      unmatchedParsedPromptVars,
    });

    expect(result.matchedMapPromptVars).not.toBe(unmatchedMapPromptVars);
    expect(result.unmatchedMapPromptVars).not.toBe(unmatchedMapPromptVars);
    expect(result.unmatchedParsedPromptVars).not.toBe(
      unmatchedParsedPromptVars,
    );
  });
});

describe(matchPlaygroundMapPromptVarsByDistance, () => {
  it("matches prompts within Levenshtein threshold", () => {
    const thetaParsedPromptVars = TEST_FILE_C_PARSED_RESULT.prompts[4].vars;
    const thetaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[4],
    );

    const deltaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[0],
    );

    const deltaMapPromptVarsLegacy = deltaMapPromptVarsLatest.map(
      playgroundMapPromptVarV2ToV1,
    );

    const mapPromptVarsVersions: PlaygroundMap.PromptVar[][] = [
      deltaMapPromptVarsLegacy,
      deltaMapPromptVarsLatest,
    ];

    for (const deltaMapPromptVars of mapPromptVarsVersions) {
      const result = matchPlaygroundMapPromptVarsByDistance({
        source: TEST_FILE_C_SOURCE,
        matchedMapPromptVarExps: {},
        unmatchedMapPromptVars: new Set(deltaMapPromptVars),
        unmatchedParsedPromptVars: new Set(thetaParsedPromptVars),
      });

      const matchedMapPromptVars = new Map();
      matchedMapPromptVars.set(thetaParsedPromptVars[0], {
        ...thetaMapPromptVarsLatest[0],
        id: deltaMapPromptVarsLatest[2]?.id,
        span: thetaMapPromptVarsLatest[0]!.span,
      });
      matchedMapPromptVars.set(thetaParsedPromptVars[1], {
        ...thetaMapPromptVarsLatest[1],
        id: deltaMapPromptVarsLatest[0]?.id,
        span: thetaMapPromptVarsLatest[1]!.span,
      });

      expect(result).toEqual({
        matchedMapPromptVars,
        matchedMapPromptVarExps: {
          "${sevn}": deltaMapPromptVars[2]!.id,
          "${fivish}": deltaMapPromptVars[0]!.id,
        },
        unmatchedParsedPromptVars: new Set([thetaParsedPromptVars[2]]),
        unmatchedMapPromptVars: new Set([deltaMapPromptVars[1]]),
      });
    }
  });

  it("returns nothing when matches does not pass threshold", () => {
    const iotaParsedPromptVars = TEST_FILE_C_PARSED_RESULT.prompts[5].vars;

    const deltaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[0],
    );

    const deltaMapPromptVarsLegacy = deltaMapPromptVarsLatest.map(
      playgroundMapPromptVarV2ToV1,
    );

    const mapPromptVarsVersions: PlaygroundMap.PromptVar[][] = [
      deltaMapPromptVarsLegacy,
      deltaMapPromptVarsLatest,
    ];

    for (const deltaMapPromptVars of mapPromptVarsVersions) {
      const result = matchPlaygroundMapPromptVarsByDistance({
        source: TEST_FILE_C_SOURCE,
        matchedMapPromptVarExps: {},
        unmatchedMapPromptVars: new Set(deltaMapPromptVars),
        unmatchedParsedPromptVars: new Set(iotaParsedPromptVars),
      });

      expect(result).toEqual({
        matchedMapPromptVars: new Map(),
        matchedMapPromptVarExps: {},
        unmatchedParsedPromptVars: new Set(iotaParsedPromptVars),
        unmatchedMapPromptVars: new Set(deltaMapPromptVars),
      });
    }
  });

  it("assigns same ids to multiple vars with same expressions", () => {
    const kappaParsedPromptVars = TEST_FILE_C_PARSED_RESULT.prompts[6].vars;
    const kappaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[6],
    );

    const deltaMapPromptVarsLatest = playgroundMapVarsFromPrompt(
      TEST_FILE_C_SOURCE,
      TEST_FILE_C_PARSED_RESULT.prompts[0],
    );

    const deltaMapPromptVarsLegacy = deltaMapPromptVarsLatest.map(
      playgroundMapPromptVarV2ToV1,
    );

    const mapPromptVarsVersions: PlaygroundMap.PromptVar[][] = [
      deltaMapPromptVarsLegacy,
      deltaMapPromptVarsLatest,
    ];

    for (const deltaMapPromptVars of mapPromptVarsVersions) {
      const result = matchPlaygroundMapPromptVarsByDistance({
        source: TEST_FILE_C_SOURCE,
        matchedMapPromptVarExps: {},
        unmatchedMapPromptVars: new Set(deltaMapPromptVars),
        unmatchedParsedPromptVars: new Set(kappaParsedPromptVars),
      });

      const matchedMapPromptVars = new Map();
      const partialMatchedVar = {
        ...kappaMapPromptVarsLatest[0],
        id: deltaMapPromptVars[0]?.id,
      };
      matchedMapPromptVars.set(kappaParsedPromptVars[0], {
        ...partialMatchedVar,
        span: kappaMapPromptVarsLatest[0]!.span,
      });
      matchedMapPromptVars.set(kappaParsedPromptVars[1], {
        ...partialMatchedVar,
        span: kappaMapPromptVarsLatest[1]!.span,
      });
      matchedMapPromptVars.set(kappaParsedPromptVars[2], {
        ...partialMatchedVar,
        span: kappaMapPromptVarsLatest[2]!.span,
      });

      expect(result).toEqual({
        matchedMapPromptVars,
        matchedMapPromptVarExps: {
          "${fivish}": deltaMapPromptVars[0]!.id,
        },
        unmatchedParsedPromptVars: new Set([]),
        unmatchedMapPromptVars: new Set([
          deltaMapPromptVars[1],
          deltaMapPromptVars[2],
        ]),
      });
    }
  });

  it("clones argument sets", () => {
    const matchedMapPromptVarExps = {};
    const unmatchedMapPromptVars = new Set<any>();
    const unmatchedParsedPromptVars = new Set<any>();

    const result = matchPlaygroundMapPromptVarsByDistance({
      source: "",
      matchedMapPromptVarExps,
      unmatchedMapPromptVars,
      unmatchedParsedPromptVars,
    });

    expect(result.matchedMapPromptVars).not.toBe(unmatchedMapPromptVars);
    expect(result.unmatchedMapPromptVars).not.toBe(unmatchedMapPromptVars);
    expect(result.unmatchedParsedPromptVars).not.toBe(
      unmatchedParsedPromptVars,
    );
  });
});

//#endregion
