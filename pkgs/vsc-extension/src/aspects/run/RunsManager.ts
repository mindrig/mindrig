import { Manager } from "@/aspects/manager/Manager.js";
import { RunMessage } from "@wrkspc/core/run";
import PQueue from "p-queue";
import { AttachmentsManager } from "../attachment/AttachementsManager";
import { DatasourcesManager } from "../datasource/DatasourcesManager";
import { MessagesManager } from "../message/Manager";
import { SecretsManager } from "../secret/Manager";
import { SettingsManager } from "../settings/Manager";
import { RunManager } from "./Manager";

const DEFAULT_PARALLEL_REQUESTS = 4;

export namespace RunsManager {
  export interface Props {
    messages: MessagesManager;
    secrets: SecretsManager;
    attachments: AttachmentsManager;
    datasources: DatasourcesManager;
    settings: SettingsManager;
  }
}

export class RunsManager extends Manager {
  #messages: MessagesManager;
  #secrets: SecretsManager;
  #attachments: AttachmentsManager;
  #datasources: DatasourcesManager;
  #settings: SettingsManager;
  #queue: PQueue;

  constructor(parent: Manager, props: RunsManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#secrets = props.secrets;
    this.#attachments = props.attachments;
    this.#datasources = props.datasources;
    this.#settings = props.settings;

    this.#queue = new PQueue({
      concurrency:
        this.#settings.state.playground?.parallelRequests ||
        DEFAULT_PARALLEL_REQUESTS,
    });

    this.#messages.listen(this, "run-client-start", this.#onStart);
  }

  trigger() {
    this.#messages.send({ type: "run-server-trigger" });
  }

  #onStart(message: RunMessage.ClientStart) {
    new RunManager(this, {
      messages: this.#messages,
      secrets: this.#secrets,
      attachments: this.#attachments,
      datasources: this.#datasources,
      run: message.payload,
      queue: this.#queue,
    });
  }
}
