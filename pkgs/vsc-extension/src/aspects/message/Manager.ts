import { Manager } from "@/aspects/manager/Manager.js";
import { VscMessage } from "@wrkspc/vsc-message";
import * as vscode from "vscode";

export namespace MessagesManager {
  export interface Props {
    webview: vscode.Webview;
  }

  export type ListenCallback<Type extends VscMessage.WebviewType> = (
    message: VscMessage.Webview & { type: Type },
  ) => unknown;
}

export class MessagesManager extends Manager {
  #webview: vscode.Webview;
  #target = new EventTarget();

  constructor(parent: Manager, props: MessagesManager.Props) {
    super(parent);

    this.#webview = props.webview;

    this.#webview.onDidReceiveMessage((message: VscMessage.Webview) =>
      this.#target.dispatchEvent(
        new CustomEvent(message.type, { detail: message }),
      ),
    );
  }

  listen<Type extends VscMessage.WebviewType>(
    manager: Manager<any> | null,
    type: Type,
    callback: MessagesManager.ListenCallback<Type>,
  ): Manager.Disposable {
    const handler = (ev: CustomEvent<VscMessage.Webview & Type>) => {
      callback.call(manager, ev.detail as any);
    };

    this.#target.addEventListener(type, handler as any);

    const off = {
      dispose: () => this.#target.removeEventListener(type, handler as any),
    };

    manager?.register(off);
    return this.register(off);
  }

  send(message: VscMessage.Extension): Thenable<boolean> {
    return this.#webview.postMessage(message);
  }
}
