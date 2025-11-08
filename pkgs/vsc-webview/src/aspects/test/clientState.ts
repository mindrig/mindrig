import { Run } from "@wrkspc/core/run";

export interface TestClientState {
  runId: Run.Id | null;
}

export function buildTestClientState(): TestClientState {
  return {
    runId: null,
  };
}
