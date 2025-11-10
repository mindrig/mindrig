import { Run } from "@wrkspc/core/run";

export interface TestAppState {
  runId: Run.Id | null;
}

export function buildTestAppState(): TestAppState {
  return {
    runId: null,
  };
}
