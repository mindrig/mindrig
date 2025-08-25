import * as vscode from "vscode";
import * as path from "path";
import { getWebviewHtml } from "./html";

export class WorkbenchViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = "mindcontrol.workbench";

  private _view?: vscode.WebviewView;
  private _messageHandlers: Map<string, (message: any) => void> = new Map();

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private readonly _isDevelopment: boolean,
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken,
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri],
    };

    // Set up message handling
    webviewView.webview.onDidReceiveMessage((message) => {
      const handler = this._messageHandlers.get(message.command);
      if (handler) {
        handler(message);
      }
    });

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);
  }

  public addMessageHandler(command: string, handler: (message: any) => void) {
    this._messageHandlers.set(command, handler);
  }

  public postMessage(message: any) {
    if (this._view) {
      this._view.webview.postMessage(message);
    }
  }

  public getWebview() {
    return this._view?.webview;
  }

  private _getHtmlForWebview(webview: vscode.Webview) {
    const reactAppUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "webview.js"),
    );

    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this._extensionUri, "dist", "webview", "index.css"),
    );

    return getWebviewHtml(stylesUri.toString(), reactAppUri.toString());
  }
}
