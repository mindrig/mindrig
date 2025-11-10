import { Run } from "@wrkspc/core/run";
import { Test } from "@wrkspc/core/test";

export interface TestAppState {
  runId: Run.Id | null;
}

export namespace TestAppState {
  export type Store = {
    [Key in `tests.${Test.Id}`]: TestAppState;
  };
}

export function buildTestAppState(): TestAppState {
  return {
    runId: null,
  };
}
