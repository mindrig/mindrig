import { Manager } from "@/aspects/manager/Manager.js";
import type { Message } from "@wrkspc/core/message";
import { always } from "alwaysly";
import { log } from "smollog";
import * as vscode from "vscode";

export namespace MessagesManager {
  export interface Props {
    webview: vscode.Webview;
  }

  export type ListenCallback<Type extends Message.ClientType> = (
    message: Message.Client & { type: Type },
  ) => unknown;
}

export class MessagesManager extends Manager {
  #webview: vscode.Webview;
  #target = new EventTarget();
  #queue: Message.Server[] | null = [];

  constructor(parent: Manager | null, props: MessagesManager.Props) {
    super(parent);

    this.#webview = props.webview;

    this.#webview.onDidReceiveMessage((message: Message.Client) => {
      log.debug("Received message from webview:", message);
      this.#target.dispatchEvent(
        new CustomEvent(message.type, { detail: message }),
      );
    });
  }

  listen<Type extends Message.ClientType>(
    parent: Manager<any> | null,
    type: Type,
    callback: MessagesManager.ListenCallback<Type>,
  ): Manager.Disposable {
    const handler = (ev: CustomEvent<Message.Client & Type>) => {
      callback.call(parent, ev.detail as any);
    };

    this.#target.addEventListener(type, handler as any);

    const off = {
      dispose: () => this.#target.removeEventListener(type, handler as any),
    };

    parent?.register(off);
    return this.register(off);
  }

  async send(message: Message.Server): Promise<boolean> {
    // While webview is not ready, queue messages
    if (this.#queue) {
      this.#queue.push(message);
      log.debug("Queuing message until webview is ready:", message);
      return true;
    }

    log.debug("Sending message to webview:", message);
    return this.#webview.postMessage(message);
  }

  async ready() {
    always(this.#queue);
    const queue = this.#queue;
    log.debug(
      `Webview is ready, sending ${this.#queue.length} queued messages`,
    );
    // Mark as ready to send
    this.#queue = null;
    return Promise.all(queue.map(this.send.bind(this)));
  }
}
