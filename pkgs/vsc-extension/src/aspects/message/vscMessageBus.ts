import type { Disposable, Webview } from "vscode";
import type { VscMessage } from "@wrkspc/vsc-message";

export type VscMessageHandler<K extends VscMessage["type"]> = (
  message: Extract<VscMessage, { type: K }>,
) => void;

export interface VscMessageBusOptions {
  debug?: boolean;
  onUnhandledMessage?: (message: unknown) => void;
  logger?: (entry: { direction: "in" | "out"; message: VscMessage }) => void;
}

export class VscMessageBus implements Disposable {
  readonly #webview: Webview;
  readonly #options: VscMessageBusOptions;
  readonly #handlers = new Map<string, Set<VscMessageHandler<any>>>();
  readonly #disposables: Disposable[] = [];

  constructor(webview: Webview, options: VscMessageBusOptions = {}) {
    this.#webview = webview;
    this.#options = options;

    const subscription = this.#webview.onDidReceiveMessage((raw) => {
      const message = this.#narrowMessage(raw);

      if (!message) return;

      this.#options.logger?.({ direction: "in", message });

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
    });

    this.#disposables.push(subscription);
  }

  #narrowMessage(candidate: unknown): VscMessage | null {
    if (!candidate || typeof candidate !== "object") {
      this.#options.onUnhandledMessage?.(candidate);
      if (this.#options.debug) {
        console.warn("Received non-object webview message", candidate);
      }
      return null;
    }

    const maybeMessage = candidate as { type?: unknown };
    if (typeof maybeMessage.type !== "string") {
      this.#options.onUnhandledMessage?.(candidate);
      if (this.#options.debug) {
        console.warn("Received webview message without type", candidate);
      }
      return null;
    }

    return candidate as VscMessage;
  }

  dispose() {
    this.#handlers.clear();
    while (this.#disposables.length) this.#disposables.pop()?.dispose();
  }

  send(message: VscMessage) {
    this.#options.logger?.({ direction: "out", message });
    return this.#webview.postMessage(message);
  }

  on<K extends VscMessage["type"]>(
    type: K,
    handler: VscMessageHandler<K>,
  ): Disposable {
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

  once<K extends VscMessage["type"]>(
    type: K,
    handler: VscMessageHandler<K>,
  ): Disposable {
    const disposable = this.on(type, (message) => {
      disposable.dispose();
      handler(message);
    });
    return disposable;
  }
}
