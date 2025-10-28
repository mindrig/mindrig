import { afterEach, describe, expect, test } from "vitest";

import {
  loadPromptState,
  PLAYGROUND_STATE_VERSION,
  savePromptState,
  type PlaygroundState,
} from "../persistence";

const META = {
  file: "/workspace/example.ts",
  index: 0,
  span: { start: 0, end: 10 },
  vars: [],
  source: "prompt source",
} as const;

describe.skip("assessment persistence", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  test("savePromptState stamps schema version and preserves layout fields", () => {
    const snapshot: PlaygroundState = {
      modelConfigs: [],
      variables: {},
      inputSource: "manual",
      datasetMode: "row",
      collapsedResults: { 0: true },
      collapsedModelSettings: { 0: false },
      requestExpanded: { 0: true },
      responseExpanded: { 0: false },
      viewTabs: { 0: "raw" },
      streamingEnabled: false,
    };

    const persisted = savePromptState(META, snapshot);

    expect(persisted?.data.schemaVersion).toBe(PLAYGROUND_STATE_VERSION);
    expect(persisted?.data.collapsedResults).toEqual({ 0: true });

    const reloaded = loadPromptState(META);
    expect(reloaded?.data?.schemaVersion).toBe(PLAYGROUND_STATE_VERSION);
    expect(reloaded?.data?.streamingEnabled).toBe(false);
    expect(reloaded?.data?.viewTabs).toEqual({ 0: "raw" });
  });
});
