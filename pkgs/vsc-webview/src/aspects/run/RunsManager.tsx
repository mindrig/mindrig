import { State } from "enso";
import { useMemo } from "react";
import { RunsClientState } from "./runsClientState";

export namespace RunsManager {
  export interface Props {
    runsClientState: State<RunsClientState>;
  }
}

export class RunsManager {
  static use() {
    const runsClientState = State.use<RunsClientState>({}, []);

    const runsManager = useMemo(
      () => new RunsManager({ runsClientState }),
      [runsClientState],
    );
    return runsManager;
  }

  #runsClientState;

  constructor(props: RunsManager.Props) {
    this.#runsClientState = props.runsClientState;
  }
}
