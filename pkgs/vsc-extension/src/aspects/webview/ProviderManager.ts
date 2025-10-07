import { Manager } from "@/aspects/manager/Manager.js";
import { Page } from "@wrkspc/core/page";
import { always } from "alwaysly";
import * as vscode from "vscode";
import { WebviewManager } from "./Manager";

export namespace WebviewProviderManager {
  export interface Props {
    context: vscode.ExtensionContext;
  }

  export type Resolve = (webview: WebviewManager) => void;
}

export class WebviewProviderManager
  extends Manager
  implements vscode.WebviewViewProvider
{
  #context: vscode.ExtensionContext;
  #webview: WebviewManager | undefined;
  #webviewPromise: Promise<WebviewManager>;
  #webviewResolve: WebviewProviderManager.Resolve | undefined;

  constructor(parent: Manager, props: WebviewProviderManager.Props) {
    super(parent);

    this.#context = props.context;

    this.#webviewPromise = new Promise<WebviewManager>((resolve) => {
      this.#webviewResolve = resolve;
    });
  }

  resolveWebviewView(
    webviewView: vscode.WebviewView,
    _resolveContext: vscode.WebviewViewResolveContext,
    _cancellationToken: vscode.CancellationToken,
  ) {
    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [
        vscode.Uri.joinPath(this.#context.extensionUri, "dist"),
      ],
    };

    this.#webview = new WebviewManager(this, {
      view: webviewView,
      context: this.#context,
    });

    always(this.#webviewResolve);
    this.#webviewResolve(this.#webview);
  }

  async navigateTo(page: Page) {
    (await this.#webviewPromise).navigateTo(page);
  }

  async logOut() {
    (await this.#webviewPromise).logOut();
  }

  async runPrompt() {
    (await this.#webviewPromise).runPrompt();
  }
}
