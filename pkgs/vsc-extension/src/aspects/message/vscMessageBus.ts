import type { VscMessage } from "@wrkspc/vsc-message";
import * as vscode from "vscode";

export type VscMessageHandler<Type extends VscMessage["type"]> = (
  message: VscMessage & { type: Type },
) => void;

export class VscMessageBus implements vscode.Disposable {
  readonly #webview: vscode.Webview;
  readonly #handlers = new Map<string, Set<VscMessageHandler<any>>>();
  readonly #disposables: vscode.Disposable[] = [];

  constructor(webview: vscode.Webview) {
    this.#webview = webview;

    const subscription = this.#webview.onDidReceiveMessage(
      (message: VscMessage) => {
        const listeners = this.#handlers.get(message.type);
        if (!listeners || listeners.size === 0) return;

        for (const handler of Array.from(listeners)) {
          try {
            handler(message as never);
          } catch (error) {
            console.error(
              `VscMessageBus handler for ${message.type} threw an error`,
              error,
            );
          }
        }
      },
    );

    this.#disposables.push(subscription);
  }

  dispose() {
    this.#handlers.clear();
    while (this.#disposables.length) this.#disposables.pop()?.dispose();
  }

  send(message: VscMessage): Thenable<boolean> {
    return this.#webview.postMessage(message);
  }

  on<Type extends VscMessage["type"]>(
    type: Type,
    handler: VscMessageHandler<Type>,
  ): vscode.Disposable {
    const bucket = this.#handlers.get(type) ?? new Set();
    bucket.add(handler as VscMessageHandler<any>);
    this.#handlers.set(type, bucket);

    return {
      dispose: () => {
        const listeners = this.#handlers.get(type);
        listeners?.delete(handler as VscMessageHandler<any>);
        if (listeners && listeners.size === 0) this.#handlers.delete(type);
      },
    };
  }

  once<Type extends VscMessage["type"]>(
    type: Type,
    handler: VscMessageHandler<Type>,
  ): vscode.Disposable {
    const disposable = this.on(type, (message) => {
      disposable.dispose();
      handler(message);
    });
    return disposable;
  }
}
