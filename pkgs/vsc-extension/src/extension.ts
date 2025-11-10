import { log } from "smollog";
import * as vscode from "vscode";
import { ExtensionManager } from "./aspects/extension/Manager";

// Disable logging until WebviewProviderManager is initialized.
log.level = null;

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(new ExtensionManager({ context }));
}

export function deactivate() {}
