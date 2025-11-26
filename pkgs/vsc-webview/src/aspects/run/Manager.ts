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
  #runState: State<Run>;
  #sendMessage: MessagesContext.SendMessage;

  constructor(props: RunManager.Props) {
    this.#runState = props.runState;
    this.#sendMessage = props.sendMessage;
  }

  stopRun() {
    if (!RunsManager.running(this.#runState.value)) return;

    this.#sendMessage({
      type: "run-client-stop",
      payload: {
        runId: this.#runState.$.id.value,
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
    return this.#runState.useCompute((run) => run.status === "initialized", []);
  }

  useError(): string | null {
    return this.#runState.useCompute(
      (run) => (run.status === "error" ? run.error : null),
      [],
    );
  }

  get runId(): Run.Id {
    return this.#runState.$.id.value;
  }

  useInit(): Run.Init {
    return this.#runState.$.init.useValue();
  }
}
