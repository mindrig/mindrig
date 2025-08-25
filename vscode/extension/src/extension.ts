// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { WorkbenchViewProvider } from "./WorkbenchViewProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log('Congratulations, your extension "mindcontrol" is now active!');

  // Check if we're in development mode
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
