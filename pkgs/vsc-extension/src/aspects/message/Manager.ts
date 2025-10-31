import { Manager } from "@/aspects/manager/Manager.js";
import type { Message } from "@wrkspc/core/message";
import { always } from "alwaysly";
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

    this.#webview.onDidReceiveMessage((message: Message.Client) =>
      this.#target.dispatchEvent(
        new CustomEvent(message.type, { detail: message }),
      ),
    );
  }

  listen<Type extends Message.ClientType>(
    manager: Manager<any> | null,
    type: Type,
    callback: MessagesManager.ListenCallback<Type>,
  ): Manager.Disposable {
    const handler = (ev: CustomEvent<Message.Client & Type>) => {
      callback.call(manager, ev.detail as any);
    };

    this.#target.addEventListener(type, handler as any);

    const off = {
      dispose: () => this.#target.removeEventListener(type, handler as any),
    };

    manager?.register(off);
    return this.register(off);
  }

  async send(message: Message.Server): Promise<boolean> {
    // While webview is not ready, queue messages
    if (this.#queue) {
      this.#queue.push(message);
      return true;
    }
    return this.#webview.postMessage(message);
  }

  async ready() {
    always(this.#queue);
    const queue = this.#queue;
    // Mark as ready to send
    this.#queue = null;
    return Promise.all(queue.map(this.send.bind(this)));
  }
}
