import { Run } from "@wrkspc/core/run";

export type RunAppState = Run | undefined;

export namespace RunAppState {
  export type Store = {
    [Key in `runs.${Run.Id}`]: RunAppState;
  };
}

export function buildRunAppState(): RunAppState {
  return undefined;
}
