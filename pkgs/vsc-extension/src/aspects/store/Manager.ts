import { Manager } from "@/aspects/manager/Manager.js";
import { VscMessageStore } from "@wrkspc/core/message";
import { Store } from "@wrkspc/core/store";
import * as vscode from "vscode";
import { MessagesManager } from "../message/Manager";

export namespace StoreManager {
  export interface Props {
    context: vscode.ExtensionContext;
    messages: MessagesManager;
  }
}

export class StoreManager extends Manager {
  #context: vscode.ExtensionContext;
  #messages: MessagesManager;

  constructor(parent: Manager | null, props: StoreManager.Props) {
    super(parent);

    this.#context = props.context;
    this.#messages = props.messages;

    this.#messages.listen(this, "store-wv-get", this.#onRequest);
  }

  async get<Key extends Store.Key>(
    scope: Store.Scope,
    key: Key,
  ): Promise<Store[Key] | undefined> {
    return this.#scoped(scope).get(key);
  }

  async set<Key extends Store.Key>(
    scope: Store.Scope,
    key: Key,
    value: Store[Key],
  ): Promise<void> {
    await this.#scoped(scope).update(key as string, value);
  }

  async clear<Key extends Store.Key>(
    scope: Store.Scope,
    key: Key,
  ): Promise<void> {
    await this.#scoped(scope).update(key as string, undefined);
  }

  async #onRequest(message: VscMessageStore.WvGet<any, any>) {
    const { scope, key } = message.payload;
    const value = await this.get(scope, key);
    return this.#messages.send({
      type: "store-ext-get-response",
      requestId: message.requestId,
      payload: value,
    });
  }

  #scoped(scope: Store.Scope) {
    return scope === "global"
      ? this.#context.globalState
      : this.#context.workspaceState;
  }
}
