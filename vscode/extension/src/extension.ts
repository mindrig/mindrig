import * as vscode from "vscode";
import { WorkbenchViewProvider } from "./WorkbenchView/Provider";
import { greet } from "@mindcontrol/code-parser";

export function activate(context: vscode.ExtensionContext) {
  // Wasm test
  greet("Wasm");

  const isDevelopment =
    context.extensionMode === vscode.ExtensionMode.Development;

  const webviewProvider = new WorkbenchViewProvider(
    context.extensionUri,
    isDevelopment,
    context,
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      WorkbenchViewProvider.viewType,
      webviewProvider,
      { webviewOptions: { retainContextWhenHidden: true } },
    ),
  );

  const showWorkbenchDisposable = vscode.commands.registerCommand(
    "mindcontrol.showWorkbench",
    () => {
      vscode.commands.executeCommand(
        "workbench.view.extension.mindcontrol-workbench",
      );
    },
  );

  const addItWorksDisposable = vscode.commands.registerCommand(
    "mindcontrol.addItWorks",
    withActiveEditor(async ({ document }) => {
      const lastLineIdx = document.lineCount - 1;
      const lastLine = document.lineAt(lastLineIdx);
      const position = new vscode.Position(lastLineIdx, lastLine.text.length);

      const edit = new vscode.WorkspaceEdit();
      edit.insert(document.uri, position, "\n// It works!");

      await vscode.workspace.applyEdit(edit);
    }),
  );

  context.subscriptions.push(
    showWorkbenchDisposable,
    addItWorksDisposable,
    webviewProvider,
  );
}

export function deactivate() {}

type WithActiveEditorCallback = (
  editor: vscode.TextEditor,
) => void | Promise<void>;

type WithActiveEditorResult = () => Promise<void>;

function withActiveEditor(
  callback: WithActiveEditorCallback,
): WithActiveEditorResult {
  return async (): Promise<void> => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      return Promise.resolve();
      console.debug("No active editor found");
    }
    return await callback(editor);
  };
}
