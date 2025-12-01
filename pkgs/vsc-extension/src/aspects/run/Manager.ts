import { Manager } from "@/aspects/manager/Manager.js";
import { Datasource } from "@wrkspc/core/datasource";
import { buildResultInitialized, Result } from "@wrkspc/core/result";
import { Run, RunMessage } from "@wrkspc/core/run";
import { Setup } from "@wrkspc/core/setup";
import { always } from "alwaysly";
import PQueue from "p-queue";
import { log } from "smollog";
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

  export type BaseFieldsMap = { [Key in keyof Run.Base<string>]: true };

  export interface MatrixEntryTask {
    promise: Promise<any>;
    abort: AbortController;
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
  #tasks: RunManager.MatrixEntryTask[] = [];

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
    const { runId, reason } = message.payload;
    if (runId !== this.#run.id) return;

    const abortReason = new AbortReason(reason);

    this.#abort.abort(abortReason);
    this.#abortTasks(abortReason);

    await this.#syncCancelled();
  }

  async #start() {
    const apiKey = await this.#secrets.get("auth-vercel-gateway-key");
    if (!apiKey)
      return this.#syncError("No Vercel Gateway API key configured.");

    try {
      const results: Result.Initialized[] = [];
      const runInput = await this.#prepareInput();

      // Pause queue to allow `run-server-results-init` to be send first
      this.#queue.pause();

      for (const setup of this.#run.init.setups) {
        for (const datasources of runInput.datasourcesMatrix) {
          {
            const [result, task] = this.#initMatrixEntry({
              setup,
              datasources,
              runInput,
              apiKey,
            });
            results.push(result);
            this.#tasks.push(task);
          }
        }
      }

      await this.#sync<"running">({
        id: this.#run.id,
        status: "running",
        startedAt: Date.now(),
        updatedAt: Date.now(),
      });

      await this.#messages.send({
        type: "run-server-results-init",
        payload: { runId: this.#run.id, results },
      });

      // Resume queue, now when `run-server-results-init` is sent
      this.#queue.start();

      await this.#waitTasks();

      return this.#syncComplete();
    } catch (err) {
      // If that's the AbortReason, the run was cancelled
      if (err instanceof AbortReason) {
        await this.#syncCancelled();

        this.#abortTasks(err);
      }
      // Otherwise, it's an error
      else {
        const error =
          err instanceof RunError || err instanceof DatasourceError
            ? err.message
            : "Something went wrong";

        await this.#syncError(error);

        this.#abortTasks(new AbortReason("Run failed to start"));
      }

      // Release queue for other runs
      this.#queue.start();
    }
  }

  #waitTasks() {
    return Promise.all(this.#tasks.map(({ promise }) => promise));
  }

  #abortTasks(reason: AbortReason) {
    this.#tasks.forEach((task) => task.abort.abort(reason));
  }

  #initMatrixEntry(props: RunManager.StartMatrixEntryProps) {
    const { setup, datasources, runInput, apiKey } = props;
    const result = buildResultInitialized({
      init: { setup, datasources },
    });

    const abort = new AbortController();

    const promise = this.#queue
      .add(
        async ({ signal }) => {
          const input: Result.Input = {
            attachments: runInput.attachments,
          };

          const resultManager = new ResultManager(this, {
            messages: this.#messages,
            result,
            runId: this.#run.id,
            runInit: this.#run.init,
            input,
            apiKey,
          });

          await resultManager.generate(signal);
        },
        { signal: abort.signal },
      )
      .catch((err) => {
        // If that's the AbortReason, the run was cancelled
        if (err instanceof AbortReason) {
          // Ignore abort errors here
        }
        // Otherwise, it's an error
        else {
          log.debug("Result task failed", err);
          throw err;
        }
      });

    return [result, { promise, abort }] as const;
  }

  async #prepareInput(): Promise<Run.Input> {
    const [attachments, datasourcesMatrix] = await Promise.all([
      this.#attachments.attachmentsToInput(this.#run.init.attachments),
      this.#datasources.datasourcesToInputMatrix(this.#run.init.datasources),
    ]);
    return { attachments, datasourcesMatrix };
  }

  async #syncComplete() {
    always("startedAt" in this.#run);

    await this.#sync<"complete">({
      id: this.#run.id,
      status: "complete",
      endedAt: Date.now(),
      startedAt: this.#run.startedAt,
    });

    return this.dispose();
  }

  async #syncCancelled() {
    always("startedAt" in this.#run);

    await this.#sync<"cancelled">({
      id: this.#run.id,
      status: "cancelled",
      endedAt: Date.now(),
      startedAt: this.#run.startedAt,
    });

    return this.dispose();
  }

  async #syncError(error: string) {
    await this.#sync<"error">({
      id: this.#run.id,
      status: "error",
      error,
      endedAt: Date.now(),
    });

    return this.dispose();
  }

  async #sync<Status extends Run.Status>(patch: Run.Patch<Status>) {
    this.#assign(patch);

    await this.#messages.send({
      type: "run-server-update",
      // TODO: Figure out if TS can infer this type automatically
      payload: patch as RunMessage.ServerUpdatePayloadPatch,
    });
  }

  #assign<Status extends Run.Status>(patch: Run.Patch<Status>) {
    const run = this.#run as Record<string, any>;
    for (const key in run) {
      if (BASE_FIELDS.includes(key)) continue;
      delete run[key];
    }
    Object.assign(run, patch);
  }
}

export class RunError extends Error {
  constructor(message: string) {
    super(message);
  }
}

export class AbortReason {
  constructor(public reason: string) {}
}

const BASE_FIELDS_MAP: RunManager.BaseFieldsMap = {
  status: true,
  createdAt: true,
  id: true,
  init: true,
};

const BASE_FIELDS = Object.keys(BASE_FIELDS_MAP);
