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
    running: boolean;
    complete: boolean;
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
      payload: { runId: this.#runAppState.$.id.value },
    });
  }

  get runId(): Run.Id {
    return this.#runAppState.$.id.value;
  }
}
