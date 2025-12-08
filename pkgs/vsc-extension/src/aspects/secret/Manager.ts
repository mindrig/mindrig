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

  static maskKey(key: string): string {
    if (!key) return "****";

    const length = key.length;

    // <=4: mask entirely
    if (length <= 4) return "*".repeat(length);

    // <=8: show last 2 chars
    if (length <= 8) return "*".repeat(length - 2) + key.slice(-2);

    // Rest: show last 4 chars
    return "*".repeat(length - 4) + key.slice(-4);
  }
}
