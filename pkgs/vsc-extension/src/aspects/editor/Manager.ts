import { Manager } from "@/aspects/manager/Manager.js";
import { EditorFile } from "@wrkspc/core/editor";
import { fileExtFromPath } from "@wrkspc/core/file";
import { Language, languageIdFromExt } from "@wrkspc/core/lang";
import * as vscode from "vscode";
import { MessagesManager } from "../message/Manager";

export namespace EditorManager {
  export interface Props {
    messages: MessagesManager;
  }

  export type EventMap = {
    "file-update": EditorFile;
    "file-save": EditorFile;
    "active-change": EditorFile | null;
    "cursor-update": EditorFile;
  };
}

export class EditorManager extends Manager<EditorManager.EventMap> {
  #messages: MessagesManager;

  constructor(parent: Manager, props: EditorManager.Props) {
    super(parent);

    this.#messages = props.messages;

    this.#setActive(vscode.window.activeTextEditor);

    // Active update
    this.register(
      vscode.window.onDidChangeActiveTextEditor(
        this.#onActiveChange.bind(this),
      ),
    );

    // File update
    this.register(
      vscode.workspace.onDidChangeTextDocument(this.#onFileUpdate.bind(this)),
    );

    // File save
    this.register(
      vscode.workspace.onDidSaveTextDocument(this.#onFileSave.bind(this)),
    );

    // Cursor update
    this.register(
      vscode.window.onDidChangeTextEditorSelection(
        this.#onCursorUpdate.bind(this),
      ),
    );
  }

  //#region API

  async openFile(ref: EditorFile.Ref): Promise<void> {
    const { path, selection } = ref;

    const uri = vscode.Uri.file(path);
    const doc = await vscode.workspace.openTextDocument(uri);
    const editor = await vscode.window.showTextDocument(doc, {
      preview: false,
      preserveFocus: false,
    });

    if (!selection) return;

    const startPos = doc.positionAt(selection.start);
    const endPos = doc.positionAt(selection.end);
    const range = new vscode.Range(startPos, endPos);

    editor.selection = new vscode.Selection(startPos, endPos);
    editor.revealRange(
      range,
      vscode.TextEditorRevealType.InCenterIfOutsideViewport,
    );
  }

  //#endregion

  //#region State

  #detectFileLang(document: vscode.TextDocument): Language.Id | undefined {
    const ext = fileExtFromPath(document.fileName);
    return languageIdFromExt(ext);
  }

  #createFileState(
    document: vscode.TextDocument,
    languageId: Language.Id,
  ): EditorFile {
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

  //#region Active state

  #activeFile: EditorFile | null = null;

  get activeFile(): EditorFile | null {
    return this.#activeFile;
  }

  #onActiveChange(editor: vscode.TextEditor | undefined) {
    this.#setActive(editor);

    this.emit("active-change", this.#activeFile);

    this.#messages.send({
      type: "editor-ext-active-change",
      payload: this.#activeFile,
    });
  }

  #setActive(editor: vscode.TextEditor | undefined) {
    const languageId = editor && this.#detectFileLang(editor.document);
    this.#activeFile = languageId
      ? this.#createFileState(editor.document, languageId)
      : null;
  }

  //#endregion

  //#region File state

  #onFileUpdate(event: vscode.TextDocumentChangeEvent) {
    const filePath = event.document.uri.fsPath;

    if (filePath !== this.#activeFile?.path) return;

    this.#activeFile = {
      ...this.#activeFile,
      content: event.document.getText(),
      isDirty: event.document.isDirty,
    };

    this.emit("file-update", this.#activeFile);

    this.#messages.send({
      type: "editor-ext-file-update",
      payload: this.#activeFile,
    });
  }

  #onFileSave(document: vscode.TextDocument) {
    const filePath = document.uri.fsPath;

    if (filePath !== this.#activeFile?.path) return;

    this.#activeFile = {
      ...this.#activeFile,
      content: document.getText(),
      isDirty: false,
      lastSaved: new Date(),
    };

    this.emit("file-save", this.#activeFile);

    this.#messages.send({
      type: "editor-ext-file-save",
      payload: this.#activeFile,
    });
  }

  //#endregion

  //#region Cursor state

  #onCursorUpdate(event: vscode.TextEditorSelectionChangeEvent) {
    const { textEditor } = event;
    if (textEditor.document.uri.fsPath !== this.#activeFile?.path) return;

    const position = event.selections[0]?.active;
    if (!position) return;

    const cursorPosition = this.#convertCursorPosition(
      textEditor.document,
      position,
    );

    this.#activeFile = {
      ...this.#activeFile,
      cursor: cursorPosition,
    };

    this.emit("cursor-update", this.#activeFile);

    this.#messages.send({
      type: "editor-ext-cursor-update",
      payload: this.#activeFile,
    });
  }

  #convertCursorPosition(
    document: vscode.TextDocument,
    position: vscode.Position,
  ): EditorFile.Cursor {
    const offset = document.offsetAt(position);
    const { line, character } = position;
    return { offset, line, character };
  }

  //#endregion
}
