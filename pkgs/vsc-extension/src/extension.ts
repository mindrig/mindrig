import * as vscode from "vscode";
import { WorkbenchViewProvider } from "./WorkbenchView/Provider";

export function activate(context: vscode.ExtensionContext) {
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
    "mindrig.showWorkbench",
    () => {
      vscode.commands.executeCommand(
        "workbench.view.extension.mindrig-playground",
      );
    },
  );

  const addItWorksDisposable = vscode.commands.registerCommand(
    "mindrig.addItWorks",
    withActiveEditor(async ({ document }) => {
      const lastLineIdx = document.lineCount - 1;
      const lastLine = document.lineAt(lastLineIdx);
      const position = new vscode.Position(lastLineIdx, lastLine.text.length);

      const edit = new vscode.WorkspaceEdit();
      edit.insert(document.uri, position, "\n// It works!");

      await vscode.workspace.applyEdit(edit);
    }),
  );

  const logInDisposable = vscode.commands.registerCommand(
    "mindrig.logIn",
    async () => {
      await vscode.commands.executeCommand(
        "workbench.view.extension.mindrig-playground",
      );
      // Open the Vercel Gateway API Key panel in the webview
      try {
        (webviewProvider as any).openVercelGatewayPanel?.();
      } catch {}
    },
  );

  const logOutDisposable = vscode.commands.registerCommand(
    "mindrig.logOut",
    async () => {
      try {
        (webviewProvider as any).clearVercelGatewayKey?.();
      } catch {}
    },
  );

  const showProfileDisposable = vscode.commands.registerCommand(
    "mindrig.showProfile",
    async () => {
      await vscode.commands.executeCommand(
        "workbench.view.extension.mindrig-playground",
      );
      try {
        (webviewProvider as any).openVercelGatewayPanel?.();
      } catch {}
    },
  );

  const runPromptDisposable = vscode.commands.registerCommand(
    "mindrig.runPrompt",
    async () => {
      await vscode.commands.executeCommand(
        "workbench.view.extension.mindrig-playground",
      );
      const executed = await webviewProvider.runPromptFromCommand();
      if (!executed)
        vscode.window.showWarningMessage(
          "Mind Rig playground is not ready to run a prompt yet.",
        );
    },
  );

  context.subscriptions.push(
    showWorkbenchDisposable,
    addItWorksDisposable,
    logInDisposable,
    logOutDisposable,
    showProfileDisposable,
    runPromptDisposable,
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
