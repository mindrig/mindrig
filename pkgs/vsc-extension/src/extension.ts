import * as vscode from "vscode";
import { ExtensionManager } from "./aspects/extension/Manager";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(new ExtensionManager({ context }));
}

export function deactivate() {}
