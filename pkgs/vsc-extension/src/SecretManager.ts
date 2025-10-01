import * as vscode from "vscode";

export namespace SecretManager {
  export interface Events {
    onSecretChanged: (secret: string | undefined) => void;
  }
}

export class SecretManager {
  static readonly #exampleSecretKey = "mindrig.exampleSecret";

  #secretStorage: vscode.SecretStorage;
  #events: SecretManager.Events;

  constructor(
    secretStorage: vscode.SecretStorage,
    events: SecretManager.Events,
  ) {
    this.#secretStorage = secretStorage;
    this.#events = events;
  }

  dispose(): void {}

  async getSecret(): Promise<string | undefined> {
    return await this.#secretStorage.get(SecretManager.#exampleSecretKey);
  }

  async setSecret(secret: string): Promise<void> {
    await this.#secretStorage.store(SecretManager.#exampleSecretKey, secret);
    this.#events.onSecretChanged(secret);
  }

  async clearSecret(): Promise<void> {
    await this.#secretStorage.delete(SecretManager.#exampleSecretKey);
    this.#events.onSecretChanged(undefined);
  }
}
