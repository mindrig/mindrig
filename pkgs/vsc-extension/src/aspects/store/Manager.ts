import { Manager } from "@/aspects/manager/Manager.js";
import { Store, StoreMessage } from "@wrkspc/core/store";
import { Versioned } from "@wrkspc/core/versioned";
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

    this.#messages.listen(this, "store-client-get", this.#onRequest);
  }

  async get<Key extends Store.Prop>(
    scope: Store.Scope,
    key: Key,
  ): Promise<Store[Key] | undefined> {
    return this.#scoped(scope).get(key);
  }

  async set<Key extends Store.Prop>(
    scope: Store.Scope,
    key: Key,
    value: Versioned.Only<Store[Key]>,
  ): Promise<void> {
    await this.#scoped(scope).update(key as string, value);
  }

  async clear<Key extends Store.Prop>(
    scope: Store.Scope,
    key: Key,
  ): Promise<void> {
    await this.#scoped(scope).update(key as string, undefined);
  }

  async #onRequest(message: StoreMessage.ClientGet<any, any>) {
    const { scope, prop: key } = message.payload;
    const value = await this.get(scope, key);
    return this.#messages.send({
      type: "store-server-get-response",
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
