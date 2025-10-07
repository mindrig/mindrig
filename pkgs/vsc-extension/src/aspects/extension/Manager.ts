import { Manager } from "@/aspects/manager/Manager.js";
import * as vscode from "vscode";
import { WebviewProviderManager } from "../webview/ProviderManager";

export namespace ExtensionManager {
  export interface Props {
    context: vscode.ExtensionContext;
  }
}

export class ExtensionManager extends Manager {
  #context: vscode.ExtensionContext;
  #webviewProvider: WebviewProviderManager;

  constructor(props: ExtensionManager.Props) {
    super(null);

    this.#context = props.context;

    this.#webviewProvider = new WebviewProviderManager(this, {
      context: this.#context,
    });

    this.register(
      vscode.window.registerWebviewViewProvider(
        "mindrig.playground",
        this.#webviewProvider,
        { webviewOptions: { retainContextWhenHidden: true } },
      ),
    );

    this.register(
      vscode.commands.registerCommand(
        "mindrig.showPlayground",
        this.#showPlayground.bind(this),
      ),
    );

    this.register(
      vscode.commands.registerCommand("mindrig.logIn", async () => {
        await this.#showPlayground();
        await this.#webviewProvider.navigateTo({ type: "auth" });
      }),
    );

    this.register(
      vscode.commands.registerCommand("mindrig.logOut", async () => {
        await this.#webviewProvider.logOut();
      }),
    );

    this.register(
      vscode.commands.registerCommand("mindrig.showProfile", async () => {
        await this.#showPlayground();
        await this.#webviewProvider.navigateTo({ type: "auth" });
      }),
    );

    this.register(
      vscode.commands.registerCommand("mindrig.runPrompt", async () => {
        await this.#showPlayground();
        await this.#webviewProvider.runPrompt();
      }),
    );
  }

  #showPlayground() {
    return vscode.commands.executeCommand(
      "workbench.view.extension.mindrig-playground",
    );
  }

  get #isDevelopment(): boolean {
    return this.#context.extensionMode === vscode.ExtensionMode.Development;
  }
}
