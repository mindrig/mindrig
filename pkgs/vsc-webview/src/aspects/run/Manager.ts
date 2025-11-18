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
  #runAppState;
  #sendMessage;

  constructor(props: RunManager.Props) {
    this.#runAppState = props.runState;
    this.#sendMessage = props.sendMessage;
  }

  TODO_stopRun() {
    if (!RunsManager.running(this.#runAppState.value)) return;

    this.#sendMessage({
      type: "run-client-stop",
      payload: { runId: this.#runAppState.$.id.value },
    });
  }

  // useResultsState(): State<Result[]> | undefined {
  //   const discriminatedRun = this.#runAppState.useDiscriminate("status");
  //   switch (discriminatedRun.discriminator) {
  //     case "initialized":
  //     case "error":
  //       return;

  //     default:
  //       return discriminatedRun.state.$.results;
  //   }
  // }

  get runId(): Run.Id {
    return this.#runAppState.$.id.value;
  }

  // #update(runPatch: Run.Patch<Run.Status>) {
  //   const {} = this.#runAppState.value;
  //   this.#runAppState.set({ ...runPatch });
  // }
}
