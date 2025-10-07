import { Manager } from "@/aspects/manager/Manager.js";
import * as vscode from "vscode";
import { Secret } from "./types";

export namespace SecretsManager {
  export interface Props {
    storage: vscode.SecretStorage;
  }

  export type EventMap = {
    [Key in `update.${Secret.Key}`]: Secret.Value;
  };
}

export class SecretsManager extends Manager<SecretsManager.EventMap> {
  #storage: vscode.SecretStorage;

  constructor(parent: Manager, props: SecretsManager.Props) {
    super(parent);

    this.#storage = props.storage;
  }

  async get(key: Secret.Key): Promise<Secret.Value> {
    return await this.#storage.get(key);
  }

  async set(key: Secret.Key, secret: string): Promise<void> {
    await this.#storage.store(key, secret);
    this.emit(`update.${key}`, secret);
  }

  async clear(key: Secret.Key): Promise<void> {
    await this.#storage.delete(key);
    this.emit(`update.${key}`, undefined);
  }
}
