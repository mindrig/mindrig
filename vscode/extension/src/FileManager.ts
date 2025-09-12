import { SyncFile } from "@mindcontrol/vscode-sync";
import { Language, languageIdFromExt } from "@wrkspc/lang";
import * as vscode from "vscode";
import { fileExtFromPath } from "./aspects/file";

export interface FileManagerEvents {
  onActiveFileChanged: (fileState: SyncFile.State | null) => void;
  onFileContentChanged: (fileState: SyncFile.State) => void;
  onFileSaved: (fileState: SyncFile.State) => void;
  onCursorPositionChanged: (fileState: SyncFile.State) => void;
  onPinStateChanged: (
    pinnedFile: SyncFile.State | null,
    activeFile: SyncFile.State | null,
  ) => void;
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

  // getDisplayFile(): FileState | null {
  //   return this.#isPinned ? this.#pinnedFile : this.#activeFile;
  // }

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
      if (!this.#isPinned) this.#events.onActiveFileChanged(null);
      else
        // Always send pin state change to update active file info when pinned
        this.#events.onPinStateChanged(this.#pinnedFile, this.#activeFile);

      return;
    }

    this.#activeFile = this.#createFileState(editor.document, languageId);
    if (!this.#isPinned) this.#events.onActiveFileChanged(this.#activeFile);
    else
      // Always send pin state change to update active file info when pinned
      this.#events.onPinStateChanged(this.#pinnedFile, this.#activeFile);
  }

  //#endregion

  //#region Document state

  #handleDocumentChange(event: vscode.TextDocumentChangeEvent) {
    const filePath = event.document.uri.fsPath;

    // Update active file if this document matches the active file
    if (this.#activeFile && filePath === this.#activeFile.path) {
      this.#activeFile = {
        ...this.#activeFile,
        content: event.document.getText(),
        isDirty: event.document.isDirty,
      };

      if (!this.#isPinned) this.#events.onFileContentChanged(this.#activeFile);
    }

    // Update pinned file content if this document matches the pinned file
    if (
      this.#isPinned &&
      this.#pinnedFile &&
      this.#pinnedFilePath === filePath
    ) {
      this.#pinnedFile = {
        ...this.#pinnedFile,
        content: event.document.getText(),
        isDirty: event.document.isDirty,
        // Keep the pinned cursor position unchanged
        cursor: this.#pinnedCursorPosition || undefined,
      };

      // Send updated pinned file state
      this.#events.onPinStateChanged(this.#pinnedFile, this.#activeFile);
    }
  }

  #handleDocumentSave(document: vscode.TextDocument) {
    const filePath = document.uri.fsPath;

    // Update active file if this document matches the active file
    if (this.#activeFile && filePath === this.#activeFile.path) {
      this.#activeFile = {
        ...this.#activeFile,
        content: document.getText(),
        isDirty: false,
        lastSaved: new Date(),
      };

      if (!this.#isPinned) this.#events.onFileSaved(this.#activeFile);
    }

    // Update pinned file save state if this document matches the pinned file
    if (
      this.#isPinned &&
      this.#pinnedFile &&
      this.#pinnedFilePath === filePath
    ) {
      this.#pinnedFile = {
        ...this.#pinnedFile,
        content: document.getText(),
        isDirty: false,
        lastSaved: new Date(),
        // Keep the pinned cursor position unchanged
        cursor: this.#pinnedCursorPosition || undefined,
      };

      // Send updated pinned file state
      this.#events.onPinStateChanged(this.#pinnedFile, this.#activeFile);
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

    if (this.#isPinned)
      this.#events.onPinStateChanged(this.#pinnedFile, this.#activeFile);
    else this.#events.onCursorPositionChanged(this.#activeFile);
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

  //#region Pinning

  #pinnedFile: SyncFile.State | null = null;
  #pinnedFilePath: string | null = null;
  #pinnedCursorPosition: SyncFile.Cursor | null = null;
  #isPinned: boolean = false;

  pinCurrentFile(): boolean {
    if (!this.#activeFile) return false;

    this.#pinnedFile = { ...this.#activeFile };
    this.#pinnedFilePath = this.#activeFile.path;
    this.#pinnedCursorPosition = this.#activeFile.cursor
      ? { ...this.#activeFile.cursor }
      : null;
    this.#isPinned = true;
    this.#events.onPinStateChanged(this.#pinnedFile, this.#activeFile);
    return true;
  }

  unpinFile(): void {
    this.#pinnedFile = null;
    this.#pinnedFilePath = null;
    this.#pinnedCursorPosition = null;
    this.#isPinned = false;
    this.#events.onPinStateChanged(null, this.#activeFile);

    // Send current active file state after unpinning
    if (this.#activeFile) this.#events.onActiveFileChanged(this.#activeFile);
  }

  isPinnedState(): boolean {
    return this.#isPinned;
  }

  getPinnedFile(): SyncFile.State | null {
    return this.#pinnedFile;
  }

  //#endregion

  //#region Editing

  async addCommentToActiveFile(comment: string): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this.#detectFileLang(editor.document)) return false;

    const document = editor.document;
    const lastLine = document.lineAt(document.lineCount - 1);
    const position = new vscode.Position(
      document.lineCount - 1,
      lastLine.text.length,
    );

    const edit = new vscode.WorkspaceEdit();
    edit.insert(document.uri, position, `\n${comment}`);

    return await vscode.workspace.applyEdit(edit);
  }

  //#endregion
}
