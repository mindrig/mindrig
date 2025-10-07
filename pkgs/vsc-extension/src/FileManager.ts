import { Language, languageIdFromExt } from "@wrkspc/lang";
import { SyncFile } from "@wrkspc/vsc-sync";
import * as vscode from "vscode";
import { fileExtFromPath } from "./aspects/file";

export interface FileManagerEvents {
  onActiveFileChanged: (fileState: SyncFile.State | null) => void;
  onFileContentChanged: (fileState: SyncFile.State) => void;
  onFileSaved: (fileState: SyncFile.State) => void;
  onCursorPositionChanged: (fileState: SyncFile.State) => void;
}

export class FileManager {
  //#region Static

  private static readonly supportedExtensions = [
    ".ts",
    ".tsx",
    ".js",
    ".jsx",
    ".mjs",
    ".mjsx",
    ".cjs",
    ".cjsx",
    ".py",
    ".pyi",
  ];

  //#endregion

  //#region Instance

  #disposables: vscode.Disposable[] = [];
  #events: FileManagerEvents;

  constructor(events: FileManagerEvents) {
    this.#events = events;

    // Active editor changes
    this.#disposables.push(
      vscode.window.onDidChangeActiveTextEditor((editor) => {
        this.#handleActiveEditorChange(editor);
      }),
    );
    this.#handleActiveEditorChange(vscode.window.activeTextEditor);

    // Document state changes
    this.#disposables.push(
      vscode.workspace.onDidChangeTextDocument((event) => {
        this.#handleDocumentChange(event);
      }),
    );
    this.#disposables.push(
      vscode.workspace.onDidSaveTextDocument((document) => {
        this.#handleDocumentSave(document);
      }),
    );

    // Cursor position changes
    this.#disposables.push(
      vscode.window.onDidChangeTextEditorSelection((event) => {
        this.#handleCursorPositionChange(event);
      }),
    );
  }

  dispose() {
    this.#disposables.forEach((d) => d.dispose());
    this.#disposables = [];
  }

  //#endregion

  //#region File

  #activeFile: SyncFile.State | null = null;

  getCurrentFile(): SyncFile.State | null {
    return this.#activeFile;
  }

  #detectFileLang(document: vscode.TextDocument): Language.Id | undefined {
    const ext = fileExtFromPath(document.fileName);
    return languageIdFromExt(ext);
  }

  #createFileState(
    document: vscode.TextDocument,
    languageId: Language.Id,
  ): SyncFile.State {
    const editor = vscode.window.activeTextEditor;
    let cursorPosition;

    if (editor && editor.document === document && editor.selections[0]) {
      const position = editor.selections[0].active;
      if (position)
        cursorPosition = this.#convertCursorPosition(document, position);
    }

    return {
      path: document.uri.fsPath,
      content: document.getText(),
      isDirty: document.isDirty,
      lastSaved: document.isDirty ? undefined : new Date(),
      languageId,
      cursor: cursorPosition,
    };
  }

  //#endregion

  //#region Active editor

  #handleActiveEditorChange(editor: vscode.TextEditor | undefined) {
    const languageId = editor && this.#detectFileLang(editor.document);
    if (!languageId) {
      this.#activeFile = null;
      this.#events.onActiveFileChanged(null);
      return;
    }

    this.#activeFile = this.#createFileState(editor.document, languageId);
    this.#events.onActiveFileChanged(this.#activeFile);
  }

  //#endregion

  //#region Document state

  #handleDocumentChange(event: vscode.TextDocumentChangeEvent) {
    const filePath = event.document.uri.fsPath;

    if (this.#activeFile && filePath === this.#activeFile.path) {
      this.#activeFile = {
        ...this.#activeFile,
        content: event.document.getText(),
        isDirty: event.document.isDirty,
      };
      this.#events.onFileContentChanged(this.#activeFile);
    }
  }

  #handleDocumentSave(document: vscode.TextDocument) {
    const filePath = document.uri.fsPath;

    if (this.#activeFile && filePath === this.#activeFile.path) {
      this.#activeFile = {
        ...this.#activeFile,
        content: document.getText(),
        isDirty: false,
        lastSaved: new Date(),
      };
      this.#events.onFileSaved(this.#activeFile);
    }
  }

  //#endregion

  //#region Cursor position

  #handleCursorPositionChange(event: vscode.TextEditorSelectionChangeEvent) {
    const { textEditor } = event;
    const isActiveFileEvent =
      textEditor.document.uri.fsPath === this.#activeFile?.path;
    if (!this.#activeFile || !isActiveFileEvent) return;

    const position = event.selections[0]?.active;
    if (!position) return;

    const cursorPosition = this.#convertCursorPosition(
      textEditor.document,
      position,
    );

    this.#activeFile = { ...this.#activeFile, cursor: cursorPosition };

    this.#events.onCursorPositionChanged(this.#activeFile);
  }

  #convertCursorPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): SyncFile.Cursor {
    const offset = document.offsetAt(position);
    const { line, character } = position;
    return { offset, line, character };
  }

  //#endregion
}
