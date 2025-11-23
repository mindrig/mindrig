import { Run } from "@wrkspc/core/run";
import { State } from "enso";
import { MessagesContext } from "../message/Context";
import { RunsManager } from "./RunsManager";

export namespace RunManager {
  export interface Props {
    runState: State<Run>;
    sendMessage: MessagesContext.SendMessage;
  }

  export interface Meta {
    pending: boolean;
    error: string | null;
  }
}

export class RunManager {
  #runAppState: State<Run>;
  #sendMessage: MessagesContext.SendMessage;

  constructor(props: RunManager.Props) {
    this.#runAppState = props.runState;
    this.#sendMessage = props.sendMessage;
  }

  stopRun() {
    if (!RunsManager.running(this.#runAppState.value)) return;

    this.#sendMessage({
      type: "run-client-stop",
      payload: {
        runId: this.#runAppState.$.id.value,
        reason: "Run stopped",
      },
    });
  }

  useMeta(): RunManager.Meta {
    const pending = this.usePending();
    const error = this.useError();
    return { pending, error };
  }

  usePending(): boolean {
    return this.#runAppState.useCompute(
      (run) => run.status === "initialized",
      [],
    );
  }

  useError(): string | null {
    return this.#runAppState.useCompute(
      (run) => (run.status === "error" ? run.error : null),
      [],
    );
  }

  get runId(): Run.Id {
    return this.#runAppState.$.id.value;
  }
}
