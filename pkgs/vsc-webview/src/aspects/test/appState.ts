import { Run } from "@wrkspc/core/run";

export interface TestAppState {
  runId: Run.Id | null;
  tab: TestAppState.Tab | null;
}

export namespace TestAppState {
  export type Tab = "datasources" | "attachments";
}

export function buildTestAppState(): TestAppState {
  return {
    runId: null,
    tab: "datasources",
  };
}
