import * as vscode from "vscode";

export interface FileManagerCursorPosition {
  offset: number;
  line: number;
  character: number;
}

export interface FileManagerFileState {
  path: string;
  content: string;
  isDirty: boolean;
  lastSaved?: Date | undefined;
  language: string;
  cursorPosition?: FileManagerCursorPosition | undefined;
}

export interface FileManagerEvents {
  onActiveFileChanged: (fileState: FileManagerFileState | null) => void;
  onFileContentChanged: (fileState: FileManagerFileState) => void;
  onFileSaved: (fileState: FileManagerFileState) => void;
  onCursorPositionChanged: (fileState: FileManagerFileState) => void;
  onPinStateChanged: (
    pinnedFile: FileManagerFileState | null,
    activeFile: FileManagerFileState | null,
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

  #activeFile: FileManagerFileState | null = null;

  getCurrentFile(): FileManagerFileState | null {
    return this.#activeFile;
  }

  // getDisplayFile(): FileState | null {
  //   return this.#isPinned ? this.#pinnedFile : this.#activeFile;
  // }

  #isSupportedFile(document: vscode.TextDocument): boolean {
    const fileName = document.fileName.toLowerCase();
    return FileManager.supportedExtensions.some((ext) =>
      fileName.endsWith(ext),
    );
  }

  #createFileState(document: vscode.TextDocument): FileManagerFileState {
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
      language: document.languageId,
      cursorPosition,
    };
  }

  //#endregion

  //#region Active editor

  #handleActiveEditorChange(editor: vscode.TextEditor | undefined) {
    if (!editor || !this.#isSupportedFile(editor.document)) {
      this.#activeFile = null;
      if (!this.#isPinned) this.#events.onActiveFileChanged(null);
      else
        // Always send pin state change to update active file info when pinned
        this.#events.onPinStateChanged(this.#pinnedFile, this.#activeFile);

      return;
    }

    this.#activeFile = this.#createFileState(editor.document);
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
        cursorPosition: this.#pinnedCursorPosition || undefined,
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
        cursorPosition: this.#pinnedCursorPosition || undefined,
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

    this.#activeFile = { ...this.#activeFile, cursorPosition };

    if (this.#isPinned)
      this.#events.onPinStateChanged(this.#pinnedFile, this.#activeFile);
    else this.#events.onCursorPositionChanged(this.#activeFile);
  }

  #convertCursorPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): FileManagerCursorPosition {
    const offset = document.offsetAt(position);
    const { line, character } = position;
    return { offset, line, character };
  }

  //#endregion

  //#region Pinning

  #pinnedFile: FileManagerFileState | null = null;
  #pinnedFilePath: string | null = null;
  #pinnedCursorPosition: FileManagerCursorPosition | null = null;
  #isPinned: boolean = false;

  pinCurrentFile(): boolean {
    if (!this.#activeFile) return false;

    this.#pinnedFile = { ...this.#activeFile };
    this.#pinnedFilePath = this.#activeFile.path;
    this.#pinnedCursorPosition = this.#activeFile.cursorPosition
      ? { ...this.#activeFile.cursorPosition }
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

  getPinnedFile(): FileManagerFileState | null {
    return this.#pinnedFile;
  }

  //#endregion

  //#region Editing

  async addCommentToActiveFile(comment: string): Promise<boolean> {
    const editor = vscode.window.activeTextEditor;
    if (!editor || !this.#isSupportedFile(editor.document)) return false;

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
