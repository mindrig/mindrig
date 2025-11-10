import { Run } from "@wrkspc/core/run";
import { State } from "enso";
import { useMemo } from "react";
import { buildRunsAppState, RunsAppState } from "./runsAppState";

export namespace RunsManager {
  export interface Props {
    runsAppState: State<RunsAppState>;
  }
}

export class RunsManager {
  static use() {
    const runsAppState = State.use<RunsAppState>(buildRunsAppState(), []);

    const runsManager = useMemo(
      () => new RunsManager({ runsAppState }),
      [runsAppState],
    );
    return runsManager;
  }

  #runsAppState;

  constructor(props: RunsManager.Props) {
    this.#runsAppState = props.runsAppState;
  }

  useRun(runId: Run.Id | undefined) {
    // this.#runsAppState.useCompute
  }
}
