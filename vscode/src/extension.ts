// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from "vscode";
import { ReactWebviewProvider } from "./webview/WebviewProvider";

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
  // Use the console to output diagnostic information (console.log) and errors (console.error)
  // This line of code will only be executed once when your extension is activated
  console.log(
    'Congratulations, your extension "mindcontrol-code" is now active!',
  );

  // Register the React webview provider
  const webviewProvider = new ReactWebviewProvider(context.extensionUri);
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ReactWebviewProvider.viewType,
      webviewProvider,
    ),
  );

  // The original hello world command
  const helloWorldDisposable = vscode.commands.registerCommand(
    "mindcontrol-code.helloWorld",
    () => {
      // The code you place here will be executed every time your command is executed
      // Display a message box to the user
      vscode.window.showInformationMessage(
        "Hello World from Mind Control Code!",
      );
    },
  );

  // Command to show React webview
  const showReactViewDisposable = vscode.commands.registerCommand(
    "mindcontrol-code.showReactView",
    () => {
      vscode.commands.executeCommand(
        "workbench.view.extension.mindcontrol-code-sidebar",
      );
    },
  );

  context.subscriptions.push(helloWorldDisposable);
  context.subscriptions.push(showReactViewDisposable);
}

// This method is called when your extension is deactivated
export function deactivate() {}
