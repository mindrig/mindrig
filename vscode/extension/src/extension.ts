import * as vscode from "vscode";
import { WorkbenchViewProvider } from "./WorkbenchView/Provider";

export function activate(context: vscode.ExtensionContext) {
  const isDevelopment =
    context.extensionMode === vscode.ExtensionMode.Development;

  const webviewProvider = new WorkbenchViewProvider(
    context.extensionUri,
    isDevelopment,
  );

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      WorkbenchViewProvider.viewType,
      webviewProvider,
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

  context.subscriptions.push(showWorkbenchDisposable);
}

export function deactivate() {}
