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
      return this.#syncError({
        type: "unauthenticated",
        message: "No Vercel Gateway API key configured.",
      });

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
    } catch (error) {
      // If that's the AbortReason, the run was cancelled
      if (error instanceof AbortReason) {
        log.debug("Run was cancelled", { reason: error.reason });

        await this.#syncCancelled(() => this.#abortTasks(error));
      }
      // Otherwise, it's an actual error
      else {
        log.debug("Run start failed with error", { error });

        // TODO: Instead of assigning "Something went wrong", assign actual
        // error reason.
        //
        // See: https://ai-sdk.dev/docs/reference/ai-sdk-errors
        //
        // E.g.:
        //
        //   import { NoOutputSpecifiedError } from "ai";
        //
        //   if (NoOutputSpecifiedError.isInstance(error)) {
        //     // Handle the error
        //   }
        const runError: Run.RunError =
          error instanceof RunError || error instanceof DatasourceError
            ? { type: "generic", message: error.message }
            : { type: "generic", message: "Something went wrong" };
        log.debug("Run failed", { error, runError });

        await this.#syncError(runError, () =>
          this.#abortTasks(new AbortReason("Run failed to start")),
        );
      }

      // Release queue for other runs
      this.#queue.start();
    }
  }

  #waitTasks() {
    return Promise.all(
      this.#tasks.map(({ promise }) =>
        promise.catch(() => {
          // We ignore individual task errors here, to allow other results to complete.
        }),
      ),
    );
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
      .catch((error) => {
        // If that's the AbortReason, the run was cancelled. We can just
        // ignore it.
        if (error instanceof AbortReason) return;

        // Otherwise, it's an actual error.
        log.debug("Result task failed", error);
        throw new RunResultTaskError("Result task failed", error);
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

  async #syncCancelled(onDone?: Function) {
    always("startedAt" in this.#run);

    await this.#sync<"cancelled">({
      id: this.#run.id,
      status: "cancelled",
      endedAt: Date.now(),
      startedAt: this.#run.startedAt,
    });

    await onDone?.();

    return this.dispose();
  }

  async #syncError(error: Run.RunError, onDone?: Function) {
    await this.#sync<"errored">({
      id: this.#run.id,
      status: "errored",
      error,
      endedAt: Date.now(),
    });

    await onDone?.();

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

export class RunError extends Error {}

export class RunResultTaskError extends Error {
  constructor(
    message: string,
    public source?: unknown,
  ) {
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
