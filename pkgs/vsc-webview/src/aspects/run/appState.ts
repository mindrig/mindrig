import { Run } from "@wrkspc/core/run";

export interface RunAppState {
  run: Run;
  ui: RunAppState.Ui;
}

export namespace RunAppState {
  export interface Ui {
    showDetails: boolean;
  }
}

export function buildRunAppState(run: Run): RunAppState {
  return {
    run,
    ui: {
      showDetails: false,
    },
  };
}
