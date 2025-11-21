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

    this.#messages.listen(this, "store-client-get", this.#onGet);

    this.#messages.listen(this, "store-client-set", this.#onSet);
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

  async clearAll(scope?: Store.Scope): Promise<void> {
    if (scope) {
      const scoped = await this.#scoped(scope);
      await Promise.all(
        scoped.keys().map((key) => scoped.update(key, undefined)),
      );
    } else {
      await Promise.all([this.clearAll("global"), this.clearAll("workspace")]);
    }
  }

  async #onGet(message: StoreMessage.ClientGet<any, any>) {
    const { scope, prop } = message.payload;
    const value = await this.get(scope, prop);
    return this.#messages.send({
      type: "store-server-get-response",
      requestId: message.requestId,
      payload: value,
    });
  }

  async #onSet(message: StoreMessage.ClientSet<any, any>) {
    const {
      ref: { scope, prop },
      value,
    } = message.payload;
    await this.set(scope, prop, value);
  }

  #scoped(scope: Store.Scope) {
    return scope === "global"
      ? this.#context.globalState
      : this.#context.workspaceState;
  }
}
