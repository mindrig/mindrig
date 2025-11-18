import { VscMock, vscMock } from "@/__tests__/vsc";
import { EditorManager } from "@/aspects/editor/Manager";
import { Prompt } from "@mindrig/types";
import { EditorFile, editorFileToMeta } from "@wrkspc/core/editor";
import { PlaygroundMap, type PlaygroundState } from "@wrkspc/core/playground";
import {
  buildPromptParseResultFallback,
  buildPromptsParseResult,
} from "@wrkspc/core/prompt";
import { assert, describe, expect, it, vi } from "vitest";
import { MessagesManager } from "../message/Manager";
import { PromptsManager } from "../prompt/Manager";
import { StoreManager } from "../store/Manager";
import { PlaygroundManager } from "./Manager";
import {
  editorCursorFactory,
  parsedPromptFactory,
  playgroundSetupFactory,
  PlaygroundStateSetupFactory,
} from "./__tests__/factories";

describe(PlaygroundManager, () => {
  describe("store", () => {
    it("hydrates state from store", async () => {
      const { manager, editorFileB, mapFileB, mapPromptsB, parsedPromptsB } =
        await setupFactory({
          managerProps: ({ map, mapFileB, mapPromptsB }) => ({
            vsc: {
              context: vscMock.ExtensionContext({
                workspaceState: vscMock.Memento({
                  "playground.map": map,
                  "playground.pin": {
                    fileId: mapFileB.id,
                    promptId: mapPromptsB[0].id,
                  },
                }),
              }),
            },
          }),
        });

      const state = await manager.state;

      expect(state).toEqual({
        file: editorFileToMeta(editorFileB),
        prompt: {
          v: 1,
          fileId: mapFileB.id,
          promptId: mapPromptsB[0].id,
          content: mapPromptsB[0].content,
          vars: mapPromptsB[0].vars,
          reason: "pinned",
        },
        prompts: [
          {
            v: 1,
            fileId: mapFileB.id,
            promptId: mapPromptsB[0].id,
            preview: parsedPromptsB[0].exp,
          },
        ],
        pin: {
          fileId: mapFileB.id,
          promptId: mapPromptsB[0].id,
        },
      });
    });

    it("updates store on prompts update", async () => {
      const { vsc, prompts, map, editorFileA, mapFileA, parsedPromptsA } =
        await setupFactory();

      const sameMap =
        vsc.context.workspaceState.get<PlaygroundMap>("playground.map");
      expect(sameMap).toBe(map);

      expect(sameMap).toMatchObject({
        files: expect.objectContaining({
          [editorFileA.path]: expect.objectContaining({
            prompts: expect.arrayContaining([
              expect.objectContaining({ content: "alpha" }),
            ]),
          }),
        }),
      });

      stubPromptsParse({
        prompts,
        map: {
          [mapFileA.meta.path]: [
            parsedPromptFactory({
              exp: "alpha wolf",
              span: parsedPromptsA[0].span,
            }),
            parsedPromptsA[1],
          ],
        },
      });

      assert(vsc.window.activeTextEditor);
      await vsc.emit(
        vsc.workspace,
        "onDidChangeTextDocument",
        vscMock.TextDocumentChangeEvent({
          document: vsc.window.activeTextEditor.document,
        }),
      );

      const updatedMap =
        vsc.context.workspaceState.get<PlaygroundMap>("playground.map");
      expect(updatedMap).not.toBe(map);

      expect(updatedMap).toMatchObject({
        files: expect.objectContaining({
          [editorFileA.path]: expect.objectContaining({
            prompts: expect.arrayContaining([
              expect.objectContaining({ content: "alpha wolf" }),
            ]),
          }),
        }),
      });
    });

    it("inits empty map if none in store", async () => {
      const {
        vsc,
        manager,
        editorFileA,
        parsedPromptsA,
        mapPromptsA,
        cursorB,
        editorFileB,
        mapPromptsB,
      } = await setupFactory({
        vsc: {
          context: vscMock.ExtensionContext({
            workspaceState: vscMock.Memento({
              "playground.map": null,
              "playground.pin": null,
            }),
          }),
        },
      });

      const state = await manager.state;

      expect(state).toEqual({
        file: editorFileToMeta(editorFileA),
        prompt: expect.objectContaining({
          fileId: expect.any(String),
          promptId: expect.any(String),
          content: mapPromptsA[0].content,
        }),
        prompts: [
          {
            v: 1,
            fileId: expect.any(String),
            promptId: expect.any(String),
            preview: parsedPromptsA[0].exp,
          },
          {
            v: 1,
            fileId: expect.any(String),
            promptId: expect.any(String),
            preview: parsedPromptsA[1].exp,
          },
        ],
        pin: null,
      });

      const initialMap =
        vsc.context.workspaceState.get<PlaygroundMap>("playground.map");
      expect(initialMap).toMatchObject({
        files: {
          [editorFileA.path]: expect.objectContaining({
            prompts: [
              expect.objectContaining({ content: "alpha" }),
              expect.objectContaining({ content: "beta" }),
            ],
          }),
        },
      });

      const editorB = vscMock.TextEditor({
        document: vscMock.TextDocument({
          uri: vscMock.Uri({ fsPath: editorFileB.path }),
          offsetAt: cursorB && (() => cursorB.offset),
        }),
      });

      vsc.window.activeTextEditor = editorB;
      await vsc.emit(vsc.window, "onDidChangeActiveTextEditor", editorB);

      const activeStateB = expect.objectContaining({
        prompt: expect.objectContaining({
          fileId: expect.any(String),
          promptId: expect.any(String),
          content: mapPromptsB[0].content,
        }),
        pin: null,
      });

      expect(await manager.state).toEqual(activeStateB);

      const updatedMap =
        vsc.context.workspaceState.get<PlaygroundMap>("playground.map");
      expect(updatedMap).not.toBe(initialMap);
      expect(updatedMap).toMatchObject({
        files: {
          [editorFileA.path]: expect.objectContaining({
            id: initialMap?.files[editorFileA.path]?.id,
            prompts: [
              expect.objectContaining({
                id: initialMap?.files[editorFileA.path]?.prompts[0]?.id,
                content: "alpha",
              }),
              expect.objectContaining({
                id: initialMap?.files[editorFileA.path]?.prompts[1]?.id,
                content: "beta",
              }),
            ],
          }),
          [editorFileB.path]: expect.objectContaining({
            id: expect.any(String),
            prompts: expect.arrayContaining([
              expect.objectContaining({
                id: expect.any(String),
                content: "gamma",
              }),
            ]),
          }),
        },
      });
    });
  });

  describe("pin", () => {
    it("updates state on pin update", async () => {
      const {
        vsc,
        manager,
        messages,
        mapFileA,
        mapPromptsA,
        mapFileB,
        mapPromptsB,
      } = await setupFactory();

      const unpinnedState = expect.objectContaining({
        prompt: expect.objectContaining({
          fileId: mapFileA.id,
          promptId: mapPromptsA[0].id,
        }),
        pin: null,
      });

      expect(await manager.state).toEqual(unpinnedState);

      const pinB: PlaygroundState.Ref = {
        v: 1,
        fileId: mapFileB.id,
        promptId: mapPromptsB[0].id,
      };

      await vsc.emit(vsc.webview, "onDidReceiveMessage", {
        type: "playground-client-pin",
        payload: pinB,
      });

      const pinnedStateB = expect.objectContaining({
        prompt: expect.objectContaining({
          fileId: mapFileB.id,
          promptId: mapPromptsB[0].id,
        }),
        pin: pinB,
      });

      expect(await manager.state).toEqual(pinnedStateB);

      expect(messages.send).toHaveBeenCalledWith({
        type: "playground-server-update",
        payload: pinnedStateB,
      });

      const pinA: PlaygroundState.Ref = {
        v: 1,
        fileId: mapFileA.id,
        promptId: mapPromptsA[1].id,
      };

      await vsc.emit(vsc.webview, "onDidReceiveMessage", {
        type: "playground-client-pin",
        payload: pinA,
      });

      const pinnedStateA = expect.objectContaining({
        prompt: expect.objectContaining({
          fileId: mapFileA.id,
          promptId: mapPromptsA[1].id,
        }),
        pin: pinA,
      });

      expect(await manager.state).toEqual(pinnedStateA);

      vsc.emit(vsc.webview, "onDidReceiveMessage", {
        type: "playground-client-unpin",
      });

      expect(await manager.state).toEqual(unpinnedState);

      expect(messages.send).toHaveBeenCalledWith({
        type: "playground-server-update",
        payload: unpinnedState,
      });
    });

    it("updates pin on prompt change", async () => {
      const { vsc, manager, messages, mapFileA, mapPromptsA, editorFileA } =
        await setupFactory({
          managerProps: ({ map, mapFileA, mapPromptsA }) => ({
            vsc: {
              context: vscMock.ExtensionContext({
                workspaceState: vscMock.Memento({
                  "playground.map": map,
                  "playground.pin": {
                    fileId: mapFileA.id,
                    promptId: mapPromptsA[0].id,
                  },
                }),
              }),
            },
          }),
        });

      expect(await manager.state).toMatchObject({
        file: editorFileToMeta(editorFileA),
        prompt: expect.objectContaining({
          fileId: mapFileA.id,
          promptId: mapPromptsA[0].id,
          content: mapPromptsA[0].content,
        }),
        pin: {
          fileId: mapFileA.id,
          promptId: mapPromptsA[0].id,
        },
      });

      await vsc.emit(vsc.webview, "onDidReceiveMessage", {
        type: "playground-client-prompt-change",
        payload: {
          fileId: mapFileA.id,
          promptId: mapPromptsA[1].id,
        },
      });

      const pinChangedState = expect.objectContaining({
        file: editorFileToMeta(editorFileA),
        prompt: expect.objectContaining({
          fileId: mapFileA.id,
          promptId: mapPromptsA[1].id,
          content: mapPromptsA[1].content,
        }),
        pin: {
          fileId: mapFileA.id,
          promptId: mapPromptsA[1].id,
        },
      });

      expect(await manager.state).toMatchObject(pinChangedState);

      expect(messages.send).toHaveBeenCalledWith({
        type: "playground-server-update",
        payload: pinChangedState,
      });
    });

    it("handles prompt change to null", async () => {
      const { vsc, manager, messages, mapFileA, mapPromptsA, editorFileA } =
        await setupFactory({
          managerProps: ({ map, mapFileA, mapPromptsA }) => ({
            vsc: {
              context: vscMock.ExtensionContext({
                workspaceState: vscMock.Memento({
                  "playground.map": map,
                  "playground.pin": {
                    fileId: mapFileA.id,
                    promptId: mapPromptsA[0].id,
                  },
                }),
              }),
            },
          }),

          cursorA: editorCursorFactory({ offset: 10 }),
        });

      expect(await manager.state).toMatchObject({
        file: editorFileToMeta(editorFileA),
        prompt: expect.objectContaining({
          fileId: mapFileA.id,
          promptId: mapPromptsA[0].id,
          content: mapPromptsA[0].content,
        }),
        pin: {
          fileId: mapFileA.id,
          promptId: mapPromptsA[0].id,
        },
      });

      await vsc.emit(vsc.webview, "onDidReceiveMessage", {
        type: "playground-client-prompt-change",
        payload: null,
      });

      const pinChangedState = expect.objectContaining({
        file: editorFileToMeta(editorFileA),
        prompt: expect.objectContaining({
          fileId: mapFileA.id,
          promptId: mapPromptsA[1].id,
          content: mapPromptsA[1].content,
        }),
        pin: null,
      });

      expect(await manager.state).toMatchObject(pinChangedState);

      expect(messages.send).toHaveBeenCalledWith({
        type: "playground-server-update",
        payload: pinChangedState,
      });
    });
  });

  describe("prompts", () => {
    it("delegates prompt change to editor", async () => {
      const { vsc, editor, mapFileA, mapPromptsA, editorFileA } =
        await setupFactory({
          managerProps: ({ map, mapFileB, mapPromptsB }) => ({
            vsc: {
              context: vscMock.ExtensionContext({
                workspaceState: vscMock.Memento({
                  "playground.map": map,
                  "playground.pin": null,
                }),
              }),
            },
          }),
        });

      vi.spyOn(editor, "openFile");

      await vsc.emit(vsc.webview, "onDidReceiveMessage", {
        type: "playground-client-prompt-change",
        payload: {
          fileId: mapFileA.id,
          promptId: mapPromptsA[0].id,
        },
      });

      expect(editor.openFile).toBeCalledWith({
        path: editorFileA.path,
        selection: mapPromptsA[0].span.outer,
      });
    });
  });

  describe("editor", () => {
    it("updates state on editor active change", async () => {
      const {
        vsc,
        manager,
        messages,
        cursorB,
        editorFileB,
        mapFileB,
        mapPromptsB,
      } = await setupFactory();

      const editorB = vscMock.TextEditor({
        document: vscMock.TextDocument({
          uri: vscMock.Uri({ fsPath: editorFileB.path }),
          offsetAt: cursorB && (() => cursorB.offset),
        }),
      });

      vsc.window.activeTextEditor = editorB;
      await vsc.emit(vsc.window, "onDidChangeActiveTextEditor", editorB);

      const activeStateB = expect.objectContaining({
        prompt: expect.objectContaining({
          fileId: mapFileB.id,
          promptId: mapPromptsB[0].id,
        }),
        pin: null,
      });

      expect(await manager.state).toEqual(activeStateB);

      expect(messages.send).toHaveBeenCalledWith({
        type: "playground-server-update",
        payload: activeStateB,
      });
    });

    it("updates state on editor cursor change", async () => {
      const { vsc, manager, messages, editorFileA, mapFileA, mapPromptsA } =
        await setupFactory();

      const changedEditor = vscMock.TextEditor({
        document: vscMock.TextDocument({
          uri: vscMock.Uri({ fsPath: editorFileA.path }),
          offsetAt: () => 10,
        }),
      });

      await vsc.emit(
        vsc.window,
        "onDidChangeTextEditorSelection",
        vscMock.TextEditorSelectionChangeEvent({
          textEditor: changedEditor,
        }),
      );

      const changedCursorState = expect.objectContaining({
        prompt: expect.objectContaining({
          fileId: mapFileA.id,
          promptId: mapPromptsA[1].id,
        }),
        pin: null,
      });

      expect(await manager.state).toEqual(changedCursorState);

      expect(messages.send).toHaveBeenCalledWith({
        type: "playground-server-update",
        payload: changedCursorState,
      });
    });

    it("updates state on editor file save", async () => {
      const {
        vsc,
        manager,
        prompts,
        messages,
        mapFileA,
        mapPromptsA,
        parsedPromptsA,
      } = await setupFactory();

      const { file: initialFile } = await manager.state;
      assert(initialFile);

      stubPromptsParse({
        prompts,
        map: {
          [mapFileA.meta.path]: [
            parsedPromptFactory({
              exp: "alpha wolf",
              span: parsedPromptsA[0].span,
            }),
            parsedPromptsA[1],
          ],
        },
      });

      await postpone(1);

      assert(vsc.window.activeTextEditor);
      await vsc.emit(
        vsc.workspace,
        "onDidSaveTextDocument",
        vsc.window.activeTextEditor.document,
      );

      const expectedSavedFileState = expect.objectContaining({
        prompt: expect.objectContaining({
          fileId: mapFileA.id,
          promptId: mapPromptsA[0].id,
          content: "alpha wolf",
        }),

        prompts: [
          expect.objectContaining({
            promptId: mapPromptsA[0].id,
            preview: "alpha wolf",
          }),
          expect.objectContaining({
            promptId: mapPromptsA[1].id,
            preview: "beta",
          }),
        ],

        pin: null,
      });

      const savedFileState = await manager.state;

      expect(savedFileState).toEqual(expectedSavedFileState);

      expect(messages.send).toHaveBeenCalledWith({
        type: "playground-server-update",
        payload: expectedSavedFileState,
      });
    });

    it("updates state on editor file update", async () => {
      const {
        vsc,
        manager,
        prompts,
        messages,
        mapFileA,
        mapPromptsA,
        parsedPromptsA,
      } = await setupFactory();

      assert(vsc.window.activeTextEditor);

      stubPromptsParse({
        prompts,
        map: {
          [mapFileA.meta.path]: [
            parsedPromptFactory({
              exp: "alpha wolf",
              span: parsedPromptsA[0].span,
            }),
            parsedPromptsA[1],
          ],
        },
      });

      await vsc.emit(
        vsc.workspace,
        "onDidChangeTextDocument",
        vscMock.TextDocumentChangeEvent({
          document: vsc.window.activeTextEditor.document,
        }),
      );

      const updatedFileState = expect.objectContaining({
        prompt: expect.objectContaining({
          fileId: mapFileA.id,
          promptId: mapPromptsA[0].id,
          content: "alpha wolf",
        }),

        prompts: [
          expect.objectContaining({
            promptId: mapPromptsA[0].id,
            preview: "alpha wolf",
          }),
          expect.objectContaining({
            promptId: mapPromptsA[1].id,
            preview: "beta",
          }),
        ],

        pin: null,
      });

      expect(await manager.state).toEqual(updatedFileState);

      expect(messages.send).toHaveBeenCalledWith({
        type: "playground-server-update",
        payload: updatedFileState,
      });
    });
  });
});

namespace SetupFactory {
  export interface Props
    extends PlaygroundManagerSetupFactory.Props,
      PlaygroundStateSetupFactory.Props {
    managerProps?: PrepareManagerPropsFn;
  }

  export type PrepareManagerPropsFn = (
    playgroundSetup: PlaygroundStateSetupFactory.Result,
  ) => PlaygroundManagerSetupFactory.Props;
}

async function setupFactory(props?: SetupFactory.Props) {
  const playgroundSetup = playgroundSetupFactory({
    cursorA: editorCursorFactory({ offset: 2 }),
    cursorB: editorCursorFactory({ offset: 10 }),
    ...props,
  });

  const {
    map,
    cursorA,
    editorFileA,
    parsedPromptsA,
    editorFileB,
    parsedPromptsB,
  } = playgroundSetup;

  const managerProps = props?.managerProps?.(playgroundSetup) || props;

  const playgroundManagerSetup = await playgroundManagerSetupFactory({
    ...managerProps,

    vsc: {
      ...managerProps?.vsc,

      window: vscMock.Window({
        activeTextEditor: vscMock.TextEditor({
          document: vscMock.TextDocument({
            uri: vscMock.Uri({ fsPath: editorFileA.path }),
            offsetAt: cursorA && (() => cursorA.offset),
          }),
        }),

        ...managerProps?.vsc?.window,
      }),

      context: vscMock.ExtensionContext({
        workspaceState: vscMock.Memento({
          "playground.map": map,
          "playground.pin": null,
        }),

        ...managerProps?.vsc?.context,
      }),
    },

    editor: {
      readFile: {
        [editorFileA.path]: editorFileA,
        [editorFileB.path]: editorFileB,
      },
      ...managerProps?.editor,
    },

    prompts: {
      parse: {
        [editorFileA.path]: parsedPromptsA,
        [editorFileB.path]: parsedPromptsB,
      },
      ...managerProps?.prompts,
    },
  });

  vi.spyOn(playgroundManagerSetup.messages, "send");

  return {
    ...playgroundSetup,
    ...playgroundManagerSetup,
  };
}

namespace PlaygroundManagerSetupFactory {
  export interface Props {
    vsc?: VscMock.ApiProps;
    editor?: EditorProps;
    prompts?: PromptsProps;
  }

  export interface EditorProps {
    activeFile?: EditorFile | null;
    readFile?: SubEditorReadFile.Map;
  }

  export interface PromptsProps {
    parse?: StubPromptsParse.Map;
  }
}

async function playgroundManagerSetupFactory(
  props?: PlaygroundManagerSetupFactory.Props,
) {
  const vsc = vscMock.setup(props?.vsc);

  const messages = new MessagesManager(null, {
    webview: vsc.webview,
  });

  const editor = new EditorManager(null);

  if (props?.editor?.readFile) subEditorReadFile(editor, props.editor.readFile);

  if (props?.editor?.activeFile !== undefined)
    vi.spyOn(editor, "activeFile", "get").mockReturnValue(
      props.editor.activeFile,
    );

  const prompts = new PromptsManager(null);

  if (props?.prompts?.parse)
    stubPromptsParse({ prompts, map: props.prompts.parse });

  const store = new StoreManager(null, {
    messages,
    context: vsc.context,
  });

  const manager = new PlaygroundManager(messages, {
    messages,
    editor,
    prompts,
    store,
  });

  // Wait for hydration
  await manager.state;

  return { vsc, messages, editor, prompts, store, manager };
}

namespace StubPromptsParse {
  export interface Props {
    prompts: PromptsManager;
    map: Map;
  }

  export type Map = {
    [Key in EditorFile.Path]: readonly Prompt[];
  };
}

function stubPromptsParse(props: StubPromptsParse.Props) {
  const { prompts, map } = props;
  vi.spyOn(prompts, "parse").mockImplementation((file) => {
    const prompts = file && map[file.path];
    if (prompts) return buildPromptsParseResult({ prompts });
    return buildPromptParseResultFallback();
  });
}

namespace SubEditorReadFile {
  export type Map = Record<EditorFile.Path, EditorFile | null>;
}

function subEditorReadFile(editor: EditorManager, map: SubEditorReadFile.Map) {
  vi.spyOn(editor, "readFile").mockImplementation(async (path) => {
    return map[path] ?? null;
  });
}

async function postpone(delay = 0) {
  return new Promise((resolve) => setTimeout(resolve, delay));
}
