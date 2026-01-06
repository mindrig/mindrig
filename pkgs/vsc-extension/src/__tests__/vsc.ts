import { vi } from "vitest";
import * as vscode from "vscode";

vi.mock("vscode", (loader) => vscMock.module(loader));

export namespace Vsc {
  export type Api = typeof vscode;

  export type Window = typeof vscode.window;

  export type Workspace = typeof vscode.workspace;

  export type Uri = { new (...args: any[]): vscode.Uri };

  export type Range = { new (...args: any[]): vscode.Range };

  export type Selection = { new (...args: any[]): vscode.Selection };
}

export namespace VscMock {
  export interface Api extends Vsc.Api {
    context: vscode.ExtensionContext;

    webview: vscode.Webview;

    emit(object: unknown, event: string, ...args: unknown[]): Promise<void>;

    on(object: unknown, event: string, handler: Handler): void;
  }

  export interface ApiProps {
    window?: Vsc.Window;
    workspace?: Vsc.Workspace;
    Uri?: Vsc.Uri;
    Range?: Vsc.Range;
    Selection?: Vsc.Selection;
    context?: vscode.ExtensionContext;
    webview?: vscode.Webview;
  }

  export interface WindowProps {
    activeTextEditor?: vscode.TextEditor | undefined;
  }

  export interface WorkspaceProps {
    openTextDocument?: Vsc.Workspace["openTextDocument"];
  }

  export interface WebviewProps {}

  export interface TextEditorProps {
    document?: vscode.TextDocument;
    selections?: readonly vscode.Selection[];
  }

  export interface UriProps {
    fsPath?: string;
  }

  export interface TextDocumentProps {
    uri?: vscode.Uri;
    fileName?: string;
    getText?: vscode.TextDocument["getText"];
    isDirty?: boolean;
    offsetAt?: vscode.TextDocument["offsetAt"] | undefined;
  }

  export interface SelectionProps {
    active?: vscode.Position | undefined;
  }

  export interface PositionProps {
    line?: number;
    character?: number;
  }

  export interface RangeProps {
    start?: vscode.Position;
    end?: vscode.Position;
  }

  export interface ExtensionContextProps {
    globalState?: vscode.Memento;
    workspaceState?: vscode.Memento;
  }

  export interface TextEditorSelectionChangeEventProps {
    textEditor?: vscode.TextEditor;
    selections?: readonly vscode.Selection[];
  }

  export interface TextDocumentChangeEventProps {
    document?: vscode.TextDocument;
  }

  export type Handler = (...args: any[]) => void;

  export type ModuleLoader = () => Promise<Vsc.Api>;
}

const currentMockSymbol = Symbol();

export const vscMock = {
  [currentMockSymbol]: undefined as VscMock.Api | undefined,

  async module(importVsc: VscMock.ModuleLoader): Promise<Vsc.Api> {
    const _originalVsc = await importVsc();

    function cachedMock<Key extends keyof Vsc.Api>(key: Key): Vsc.Api[Key] {
      vscMock[currentMockSymbol] ??= vscMock.Api();
      vscMock[currentMockSymbol][key] ??= vscMock.Api()[key];
      return vscMock[currentMockSymbol][key];
    }

    return {
      get window() {
        return cachedMock("window");
      },

      get workspace() {
        return cachedMock("workspace");
      },

      get Uri() {
        return cachedMock("Uri");
      },

      get Range() {
        return cachedMock("Range");
      },

      get Selection() {
        return cachedMock("Selection");
      },

      TextEditorRevealType: {
        Default: 0,
        InCenter: 1,
        InCenterIfOutsideViewport: 2,
        AtTop: 3,
      },
    } as Vsc.Api;
  },

  setup(props?: VscMock.ApiProps | undefined): VscMock.Api {
    return (vscMock[currentMockSymbol] = vscMock.Api(props));
  },

  Api(props?: VscMock.ApiProps | undefined): VscMock.Api {
    const events = new Map<unknown, Record<string, VscMock.Handler[]>>();

    return {
      window: props?.window ?? vscMock.Window(),

      workspace: props?.workspace ?? vscMock.Workspace(props?.workspace),

      Uri: props?.Uri ?? (vscMock.UriClass() as unknown),

      Range: props?.Range ?? vscMock.RangeClass(),

      Selection: props?.Selection ?? vscMock.SelectionClass(),

      context: props?.context ?? vscMock.ExtensionContext(),

      webview: props?.webview ?? vscMock.Webview(),

      emit(object: unknown, event: string, ...args: unknown[]) {
        events.get(object)?.[event]?.forEach((handler) => handler(...args));
        return new Promise((resolve) => setTimeout(resolve));
      },

      on(object: unknown, event: string, handler: VscMock.Handler) {
        let objectEvents = events.get(object);
        if (!objectEvents) events.set(object, (objectEvents = {}));
        objectEvents[event] ??= [];
        objectEvents[event].push(handler);
      },
    } as VscMock.Api;
  },

  Window(props?: VscMock.WindowProps | undefined): Vsc.Window {
    return {
      onDidChangeActiveTextEditor(handler) {
        vscMock[currentMockSymbol]?.on(
          this,
          "onDidChangeActiveTextEditor",
          handler,
        );
        return vscMock.Disposable();
      },

      onDidChangeTextEditorSelection(handler) {
        vscMock[currentMockSymbol]?.on(
          this,
          "onDidChangeTextEditorSelection",
          handler,
        );
        return vscMock.Disposable();
      },

      activeTextEditor: props?.activeTextEditor ?? vscMock.TextEditor(),

      showTextDocument: (async (document) => {
        return vscMock.TextEditor({
          document: document as vscode.TextDocument,
        });
      }) as Vsc.Window["showTextDocument"],
    } as Vsc.Window;
  },

  Workspace(props?: VscMock.WorkspaceProps | undefined): Vsc.Workspace {
    return {
      onDidChangeTextDocument(handler) {
        vscMock[currentMockSymbol]?.on(
          this,
          "onDidChangeTextDocument",
          handler,
        );
        return vscMock.Disposable();
      },

      onDidSaveTextDocument(handler) {
        vscMock[currentMockSymbol]?.on(this, "onDidSaveTextDocument", handler);
        return vscMock.Disposable();
      },

      openTextDocument:
        props?.openTextDocument ??
        (((uri) => {
          return Promise.resolve(
            vscMock.TextDocument({ uri: uri as vscode.Uri }),
          );
        }) as Vsc.Workspace["openTextDocument"]),
    } as Vsc.Workspace;
  },

  UriClass(): Vsc.Uri {
    return class {
      constructor() {
        return vscMock.Uri();
      }

      static file(path: string) {
        return vscMock.Uri({ fsPath: path });
      }
    } as unknown as Vsc.Uri;
  },

  Uri(props?: VscMock.UriProps | undefined): vscode.Uri {
    return {
      fsPath: props?.fsPath ?? `/file-mock.ts`,
    } as vscode.Uri;
  },

  RangeClass(): Vsc.Range {
    return class {
      constructor(start: vscode.Position, end: vscode.Position) {
        return vscMock.Range({ start, end });
      }
    } as Vsc.Range;
  },

  Range(props?: VscMock.RangeProps | undefined): vscode.Range {
    return {
      start: props?.start ?? 0,
      end: props?.end ?? 0,
    } as unknown as vscode.Range;
  },

  SelectionClass(): Vsc.Selection {
    return class {
      constructor(start: vscode.Position, end: vscode.Position) {
        return vscMock.Selection({ active: start });
      }
    } as unknown as Vsc.Selection;
  },

  Webview(): vscode.Webview {
    return {
      postMessage: vi.fn().mockResolvedValue(true),

      onDidReceiveMessage(handler) {
        vscMock[currentMockSymbol]?.on(this, "onDidReceiveMessage", handler);
        return vscMock.Disposable();
      },

      options: {} as any,

      html: {} as any,

      asWebviewUri: vi.fn(),

      cspSource: {} as any,
    };
  },

  TextEditor(props?: VscMock.TextEditorProps | undefined): vscode.TextEditor {
    return {
      document: props?.document ?? vscMock.TextDocument(),
      selections: props?.selections || [vscMock.Selection()],
      revealRange: vi.fn() as vscode.TextEditor["revealRange"],
    } as vscode.TextEditor;
  },

  TextDocument(
    props?: VscMock.TextDocumentProps | undefined,
  ): vscode.TextDocument {
    return {
      fileName: props?.fileName ?? `/file.ts`,
      uri: props?.uri ?? vscMock.Uri(),
      getText:
        props?.getText ??
        vi.fn().mockReturnValue('console.log("Hello, world!");'),
      isDirty: props?.isDirty ?? false,
      offsetAt: props?.offsetAt ?? vi.fn(),
      positionAt: vi.fn() as vscode.TextDocument["positionAt"],
    } as vscode.TextDocument;
  },

  Selection(props?: VscMock.SelectionProps | undefined): vscode.Selection {
    return {
      active: vscMock.Position(props?.active),
    } as vscode.Selection;
  },

  Position(props?: VscMock.PositionProps | undefined): vscode.Position {
    return {
      line: props?.line ?? 0,
      character: props?.character ?? 0,
    } as vscode.Position;
  },

  Disposable(): vscode.Disposable {
    return {
      dispose: vi.fn(),
    };
  },

  ExtensionContext(
    props?: VscMock.ExtensionContextProps,
  ): vscode.ExtensionContext {
    return {
      globalState: props?.globalState ?? vscMock.Memento(),
      workspaceState: props?.workspaceState ?? vscMock.Memento(),
    } as vscode.ExtensionContext;
  },

  Memento(initial?: Record<string, unknown>): vscode.Memento {
    const store: Record<string, unknown> = initial || {};

    return {
      get(key: string) {
        return store[key];
      },

      update(key: string, value: unknown) {
        store[key] = value;
      },
    } as vscode.Memento;
  },

  TextEditorSelectionChangeEvent(
    props?: VscMock.TextEditorSelectionChangeEventProps | undefined,
  ): vscode.TextEditorSelectionChangeEvent {
    return {
      textEditor: props?.textEditor ?? vscMock.TextEditor(),
      selections: props?.selections ?? [vscMock.Selection()],
    } as vscode.TextEditorSelectionChangeEvent;
  },

  TextDocumentChangeEvent(
    props?: VscMock.TextDocumentChangeEventProps | undefined,
  ): vscode.TextDocumentChangeEvent {
    return {
      document: props?.document ?? vscMock.TextDocument(),
    } as vscode.TextDocumentChangeEvent;
  },
};

vscMock[currentMockSymbol] = vscMock.Api();
