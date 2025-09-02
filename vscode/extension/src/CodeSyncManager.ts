import { computeTextChanges } from "@mindcontrol/vscode-sync";
import * as vscode from "vscode";
import * as Y from "yjs";

export namespace CodeSyncManager {
  export interface Options {
    onDocumentChanged: (content: string) => void;
    onRemoteChange: (changes: Uint8Array) => void;
  }

  export interface SyncMessage {
    type: "sync-update" | "sync-state-vector" | "sync-init";
    data: Uint8Array;
    documentId?: string;
  }
}

export class CodeSyncManager {
  #ydoc: Y.Doc;
  #ytext: Y.Text;
  #options: CodeSyncManager.Options;
  #currentDocumentUri: vscode.Uri | null = null;
  #isApplyingRemoteChanges = false;
  #isApplyingToVSCode = false;
  #documentChangeListener: vscode.Disposable | null = null;
  #pendingWorkspaceEdit = false;

  constructor(options: CodeSyncManager.Options) {
    this.#options = options;

    this.#ydoc = new Y.Doc();
    this.#ytext = this.#ydoc.getText("content");

    this.#setupDocumentObserver();
  }

  #setupDocumentObserver() {
    this.#ytext.observe((event, transaction) => {
      // Skip if we're applying remote changes
      if (this.#isApplyingRemoteChanges) return;

      const content = this.#ytext.toString();
      this.#options.onDocumentChanged(content);
    });

    this.#ydoc.on("update", (update: Uint8Array, origin: any) => {
      // Only send updates to webview if they didn't originate from webview
      if (this.#isApplyingRemoteChanges) return;

      this.#options.onRemoteChange(update);
    });
  }

  setActiveDocument(uri: vscode.Uri, initialContent: string) {
    if (this.#currentDocumentUri?.toString() === uri.toString()) return; // Same document, no change needed

    this.#currentDocumentUri = uri;

    // Clear existing document listener
    if (this.#documentChangeListener) {
      this.#documentChangeListener.dispose();
      this.#documentChangeListener = null;
    }

    // Initialize document content
    this.#isApplyingRemoteChanges = true;
    this.#ytext.delete(0, this.#ytext.length);
    if (initialContent.length > 0) this.#ytext.insert(0, initialContent);

    this.#isApplyingRemoteChanges = false;

    // Set up new document listener
    this.#setupDocumentListener(uri);
  }

  #setupDocumentListener(uri: vscode.Uri) {
    const document = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === uri.toString(),
    );

    if (!document) return;

    this.#documentChangeListener = vscode.workspace.onDidChangeTextDocument(
      (event) => {
        if (event.document.uri.toString() !== uri.toString()) return;
        if (
          this.#isApplyingRemoteChanges ||
          this.#isApplyingToVSCode ||
          this.#pendingWorkspaceEdit
        ) {
          console.log(
            "Ignoring VS Code document change (applying remote changes)",
            JSON.stringify({
              isApplyingRemoteChanges: this.#isApplyingRemoteChanges,
              isApplyingToVSCode: this.#isApplyingToVSCode,
              pendingWorkspaceEdit: this.#pendingWorkspaceEdit,
            }),
          );
          return;
        }

        console.log(
          "Processing VS Code document change",
          JSON.stringify({
            changeCount: event.contentChanges.length,
            changes: event.contentChanges.map((c) => ({
              start: c.rangeOffset,
              delete: c.rangeLength,
              insert: c.text,
            })),
          }),
        );

        // Apply VS Code changes to Yjs document
        try {
          for (const change of event.contentChanges) {
            // Use the provided rangeOffset and rangeLength if available, otherwise calculate
            const startOffset =
              change.rangeOffset ?? event.document.offsetAt(change.range.start);
            const deleteLength =
              change.rangeLength ??
              event.document.offsetAt(change.range.end) - startOffset;

            if (deleteLength > 0) this.#ytext.delete(startOffset, deleteLength);

            if (change.text) this.#ytext.insert(startOffset, change.text);
          }
        } catch (error) {
          console.error("Failed to apply VS Code changes to Yjs:", error);
        }
      },
    );
  }

  applyRemoteUpdate(update: Uint8Array, applyToVSCode: boolean = false) {
    console.log(
      "CodeSyncManager applyRemoteUpdate",
      JSON.stringify({ updateSize: update.length, applyToVSCode }),
    );
    console.log(
      "Flags before applying remote update",
      JSON.stringify({
        isApplyingRemoteChanges: this.#isApplyingRemoteChanges,
        isApplyingToVSCode: this.#isApplyingToVSCode,
      }),
    );
    this.#isApplyingRemoteChanges = true;

    try {
      Y.applyUpdate(this.#ydoc, update);

      // Apply to VS Code only if explicitly requested (e.g., from webview)
      if (applyToVSCode) {
        console.log("Applying update to VS Code...");
        this.#applyToVSCode();
      }
    } catch (error) {
      console.error("Failed to apply remote update:", error);
    } finally {
      this.#isApplyingRemoteChanges = false;
    }
  }

  // New method specifically for applying updates that should sync to VS Code
  // (e.g., from other remote clients, not from webview)
  applyRemoteUpdateToVSCode(update: Uint8Array) {
    this.#isApplyingRemoteChanges = true;

    try {
      Y.applyUpdate(this.#ydoc, update);

      // Apply the updated content to VS Code editor
      this.#applyToVSCode();
    } catch (error) {
      console.error("Failed to apply remote update:", error);
    } finally {
      this.#isApplyingRemoteChanges = false;
    }
  }

  async #applyToVSCode() {
    if (!this.#currentDocumentUri) return;

    const document = vscode.workspace.textDocuments.find(
      (doc) => doc.uri.toString() === this.#currentDocumentUri!.toString(),
    );

    if (!document) return;

    const newContent = this.#ytext.toString();
    const currentContent = document.getText();

    console.log(
      "applyToVSCode content comparison",
      JSON.stringify({
        newLength: newContent.length,
        currentLength: currentContent.length,
        same: newContent === currentContent,
      }),
    );

    if (newContent === currentContent) return;

    // Set both flags to prevent feedback loops
    console.log(
      "Setting applyToVSCode flags",
      JSON.stringify({
        before: {
          isApplyingRemoteChanges: this.#isApplyingRemoteChanges,
          isApplyingToVSCode: this.#isApplyingToVSCode,
        },
      }),
    );
    this.#isApplyingToVSCode = true;
    this.#isApplyingRemoteChanges = true;
    this.#pendingWorkspaceEdit = true;
    console.log(
      "Flags set",
      JSON.stringify({
        after: {
          isApplyingRemoteChanges: this.#isApplyingRemoteChanges,
          isApplyingToVSCode: this.#isApplyingToVSCode,
          pendingWorkspaceEdit: this.#pendingWorkspaceEdit,
        },
      }),
    );
    try {
      const changes = computeTextChanges(currentContent, newContent);
      console.log(
        "Computed text changes for VS Code",
        JSON.stringify({ changes }),
      );

      if (changes.length === 0) {
        console.log("No changes to apply, returning early");
        return;
      }

      console.log("Creating VS Code workspace edit...");
      const edit = new vscode.WorkspaceEdit();

      // Apply changes in reverse order to maintain correct positions
      for (let idx = changes.length - 1; idx >= 0; idx--) {
        const change = changes[idx];
        if (!change) continue;

        const startPos = document.positionAt(change.start);
        const endPos = document.positionAt(change.start + change.delete);
        const range = new vscode.Range(startPos, endPos);

        console.log(
          "Creating workspace edit operation",
          JSON.stringify({
            index: idx,
            change,
            startPos: { line: startPos.line, character: startPos.character },
            endPos: { line: endPos.line, character: endPos.character },
            insertCharCodes: change.insert
              .split("")
              .map((c) => c.charCodeAt(0)),
          }),
        );

        if (change.delete > 0 && change.insert.length > 0) {
          // Replace operation
          console.log("Adding replace operation");
          edit.replace(this.#currentDocumentUri, range, change.insert);
        } else if (change.delete > 0) {
          // Delete operation
          console.log("Adding delete operation");
          edit.delete(this.#currentDocumentUri, range);
        } else if (change.insert.length > 0) {
          // Insert operation
          console.log("Adding insert operation");
          edit.insert(this.#currentDocumentUri, startPos, change.insert);
        }
      }

      console.log("Applying workspace edit to VS Code...");
      const result = await vscode.workspace.applyEdit(edit);
      console.log("Workspace edit result", JSON.stringify({ success: result }));

      // Add a small delay to ensure VS Code has fully processed the edit
      // before we clear the flags
      await new Promise((resolve) => setTimeout(resolve, 50));
    } catch (error) {
      console.error("Failed to apply changes to VS Code:", error);
      // Fallback to full document replacement
      try {
        const edit = new vscode.WorkspaceEdit();
        const fullRange = new vscode.Range(
          document.positionAt(0),
          document.positionAt(currentContent.length),
        );
        edit.replace(this.#currentDocumentUri, fullRange, newContent);
        console.log("Applying fallback full document replacement...");
        const fallbackResult = await vscode.workspace.applyEdit(edit);
        console.log(
          "Fallback edit result",
          JSON.stringify({ success: fallbackResult }),
        );
      } catch (fallbackError) {
        console.error("Fallback edit also failed:", fallbackError);
      }
    } finally {
      console.log(
        "Clearing applyToVSCode flags",
        JSON.stringify({
          before: {
            isApplyingRemoteChanges: this.#isApplyingRemoteChanges,
            isApplyingToVSCode: this.#isApplyingToVSCode,
            pendingWorkspaceEdit: this.#pendingWorkspaceEdit,
          },
        }),
      );
      this.#isApplyingToVSCode = false;
      this.#isApplyingRemoteChanges = false;
      this.#pendingWorkspaceEdit = false;
      console.log(
        "Flags cleared",
        JSON.stringify({
          after: {
            isApplyingRemoteChanges: this.#isApplyingRemoteChanges,
            isApplyingToVSCode: this.#isApplyingToVSCode,
            pendingWorkspaceEdit: this.#pendingWorkspaceEdit,
          },
        }),
      );
    }
  }

  // Using extracted computeCodeChanges from utils/textDiff

  getStateVector(): Uint8Array {
    return Y.encodeStateVector(this.#ydoc);
  }

  getUpdate(stateVector?: Uint8Array): Uint8Array {
    return Y.encodeStateAsUpdate(this.#ydoc, stateVector);
  }

  dispose() {
    if (this.#documentChangeListener) this.#documentChangeListener.dispose();

    this.#ydoc.destroy();
  }
}
