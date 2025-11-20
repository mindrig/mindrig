import { Manager } from "@/aspects/manager/Manager.js";
import { Datasource } from "@wrkspc/core/datasource";
import { buildResultInitialized, Result } from "@wrkspc/core/result";
import { Run, RunMessage } from "@wrkspc/core/run";
import { Setup } from "@wrkspc/core/setup";
import { always } from "alwaysly";
import PQueue from "p-queue";
import { AttachmentsManager } from "../attachment/AttachementsManager";
import {
  DatasourceError,
  DatasourcesManager,
} from "../datasource/DatasourcesManager";
import { MessagesManager } from "../message/Manager";
import { ResultManager } from "../result/Manager";
import { SecretsManager } from "../secret/Manager";

export namespace RunManager {
  export interface Props {
    messages: MessagesManager;
    secrets: SecretsManager;
    attachments: AttachmentsManager;
    datasources: DatasourcesManager;
    run: Run.Initialized;
    queue: PQueue;
  }

  export interface StartMatrixEntryProps {
    setup: Setup;
    datasources: Datasource.Input[];
    runInput: Run.Input;
    apiKey: string;
  }
}

export class RunManager extends Manager {
  #messages: MessagesManager;
  #secrets: SecretsManager;
  #attachments: AttachmentsManager;
  #datasources: DatasourcesManager;
  #run: Run;
  #queue: PQueue;
  #abort;

  constructor(parent: Manager, props: RunManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#secrets = props.secrets;
    this.#attachments = props.attachments;
    this.#datasources = props.datasources;
    this.#run = props.run;
    this.#queue = props.queue;

    this.#abort = new AbortController();

    this.#messages.listen(this, "run-client-stop", this.#onStop);

    this.#start();
  }

  async #onStop(message: RunMessage.ClientStop) {
    if (message.payload.runId !== this.#run.id) return;
  }

  async #start() {
    const apiKey = await this.#secrets.get("auth-vercel-gateway-key");
    if (!apiKey) return this.#error("No Vercel Gateway API key configured.");

    try {
      const runInput = await this.#prepareInput();
      const results: Result.Initialized[] = [];
      const tasks: Promise<unknown>[] = [];

      for (const setup of this.#run.init.setups) {
        for (const datasources of runInput.datasourcesMatrix) {
          {
            const [result, task] = this.#startMatrixEntry({
              setup,
              datasources,
              runInput,
              apiKey,
            });
            results.push(result);
            tasks.push(task);
          }
        }
      }

      this.#messages.send({
        type: "run-server-update",
        payload: {
          id: this.#run.id,
          status: "running",
          startedAt: Date.now(),
          updatedAt: Date.now(),
        },
      });

      this.#messages.send({
        type: "run-server-results-init",
        payload: { runId: this.#run.id, results },
      });
    } catch (err) {
      const error =
        err instanceof RunError || err instanceof DatasourceError
          ? err.message
          : "Something went wrong";
      return this.#error(error);
    }
  }

  #startMatrixEntry(props: RunManager.StartMatrixEntryProps) {
    const { setup, datasources, runInput, apiKey } = props;
    const result = buildResultInitialized({
      init: { setup, datasources },
    });

    const input: Result.Input = {
      attachments: runInput.attachments,
    };

    const resultMng = new ResultManager(this, {
      messages: this.#messages,
      result,
      runId: this.#run.id,
      runInit: this.#run.init,
      input,
      abort: this.#abort,
      apiKey,
    });

    const task = this.#queue
      .add(({ signal }) => resultMng.generate(signal), {
        signal: this.#abort.signal,
      })
      .catch((err) => {
        // Ignore aborted task
        if (err instanceof DOMException) return;
        throw err;
      });

    return [result, task] as const;
  }

  async #prepareInput(): Promise<Run.Input> {
    const [attachments, datasourcesMatrix] = await Promise.all([
      this.#attachments.attachmentsToInput(this.#run.init.attachments),
      this.#datasources.datasourcesToInputMatrix(this.#run.init.datasources),
    ]);
    return { attachments, datasourcesMatrix };
  }

  async #cancel(error: string) {
    always("startedAt" in this.#run);

    await this.#messages.send({
      type: "run-server-update",
      payload: {
        id: this.#run.id,
        status: "cancelled",
        cancelledAt: Date.now(),
        startedAt: this.#run.startedAt,
      },
    });
    return this.dispose();
  }

  async #error(error: string) {
    await this.#messages.send({
      type: "run-server-update",
      payload: {
        id: this.#run.id,
        status: "error",
        error,
        erroredAt: Date.now(),
      },
    });
    return this.dispose();
  }
}

export class RunError extends Error {
  constructor(message: string) {
    super(message);
  }
}
