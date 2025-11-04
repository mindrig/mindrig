// @ts-nocheck

import type { Prompt } from "@mindrig/types";
import { act, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Assessment } from "../Assessment";
// import {
//   clearVscMocks,
//   createMockVscApi,
//   renderWithVsc,
// } from "@/testUtils/messages";

const { persistenceMocks } = vi.hoisted(() => {
  const runResult = {
    success: true,
    runId: "run-1",
    resultId: "result-1",
    label: "Result 1",
    prompt: null,
    text: "Rendered output",
    textParts: [],
    streaming: false,
    isLoading: false,
    nonStreamingNote: null,
    request: { foo: "bar" },
    response: { baz: "qux" },
    usage: null,
    totalUsage: null,
    steps: null,
    error: null,
    model: {
      key: "model-key",
      id: "model-1",
      providerId: "openai",
      label: "Model 1",
      settings: {
        options: {},
        reasoning: { enabled: false, effort: "medium", budgetTokens: "" },
        providerOptions: null,
        tools: null,
        attachments: [],
      },
    },
  } as const;

  const data = {
    modelConfigs: [
      {
        key: "model-key",
        providerId: "openai",
        modelId: "model-1",
        label: "Model 1",
        generationOptions: {},
        reasoning: { enabled: false, effort: "medium", budgetTokens: "" },
        toolsJson: "",
        providerOptionsJson: "{}",
        attachments: [],
      },
    ],
    variables: {},
    csv: null,
    execution: {
      results: [runResult],
      error: null,
      timestamp: 123,
    },
    layout: "vertical",
    activeResultIndex: 0,
    collapsedResults: { 0: true },
    collapsedModelSettings: { 0: false },
    requestExpanded: { 0: true },
    responseExpanded: { 0: false },
    viewTabs: { 0: "raw" },
    streamingEnabled: false,
  };

  return {
    persistenceMocks: {
      load: vi.fn(() => ({ data })),
      save: vi.fn(() => null),
    },
  };
});

vi.mock("../persistence", async () => {
  const actual =
    await vi.importActual<typeof import("../persistence")>("../persistence");
  return {
    ...actual,
    loadPromptState: persistenceMocks.load,
    savePromptState: persistenceMocks.save,
  };
});

vi.mock("@/aspects/models/Context", () => ({
  useModels: () => ({
    models: [
      {
        id: "model-1",
        name: "Model 1",
        specification: { provider: "openai" },
        pricing: {},
      },
    ],
    providers: {
      openai: {
        id: "openai",
        name: "OpenAI",
      },
    },
    gateway: undefined,
    gatewayModels: [],
    gatewayError: null,
    dotDev: undefined,
    dotDevData: {},
    dotDevError: null,
    isDotDevFallback: false,
    isLoading: false,
    keyStatus: {
      status: "idle",
      message: null,
      source: "fallback",
      fallbackUsed: false,
      userAttempted: false,
    },
    retry: vi.fn(),
    modelsByProvider: { openai: [{ id: "model-1", label: "Model 1" }] },
    getProvider: vi.fn(),
    getModel: vi.fn(),
    getCapabilities: vi.fn(() => ({
      supportsImages: false,
      supportsVideo: false,
      supportsFiles: false,
      supportsTools: false,
      supportsReasoning: false,
    })),
  }),
}));

vi.mock("@wrkspc/dataset", () => ({
  buildRunsAndSettings: vi.fn(() => ({ runs: [], runSettings: {} })),
  computeVariablesFromRow: vi.fn(() => ({})),
}));

vi.mock("@wrkspc/model", () => ({
  selectedModelCapabilities: () => ({
    supportsImages: false,
    supportsVideo: false,
    supportsFiles: false,
    supportsTools: false,
    supportsReasoning: false,
    provider: "openai",
  }),
  filterAttachmentsForCapabilities: (attachments: any) => attachments,
  mergeProviderOptionsWithReasoning: (options: any) => options,
  providerFromEntry: () => "openai",
  providerLogoUrl: () => "",
}));

vi.mock("@wrkspc/prompt", () => ({
  extractPromptText: () => "",
  substituteVariables: () => "",
}));

vi.mock("smolcsv", () => ({
  parseString: () => ({ header: [], rows: [] }),
}));

beforeEach(() => {
  persistenceMocks.load.mockClear();
  persistenceMocks.save.mockClear();
});

describe.skip("Assessment shared state integration", () => {
  const prompt: Prompt = {
    file: "/tmp/prompt.md",
    span: {
      outer: { start: 0, end: 20 },
      inner: { start: 0, end: 20 },
    },
    exp: "Prompt",
    vars: [],
  };

  it("hydrates persisted results and persists layout/view changes", async () => {
    const mockVsc = createMockVscApi();

    await act(async () => {
      renderWithVsc(
        <Assessment prompt={prompt} vercelGatewayKey={null} />,
        mockVsc,
      );
    });

    await screen.findByText("Result 1");
    expect(persistenceMocks.load).toHaveBeenCalledTimes(1);

    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: "Horizontal" }));

    await waitFor(() => {
      const calls = persistenceMocks.save.mock.calls as Array<
        [unknown, Record<string, unknown> | undefined]
      >;
      expect(
        calls.some(([, snapshot]) => snapshot?.layout === "horizontal"),
      ).toBe(true);
    });
    expect(persistenceMocks.save).toHaveBeenCalled();

    const lastSnapshot =
      persistenceMocks.save.mock.calls.at(-1)?.[1] ??
      ({} as Record<string, unknown>);
    expect(lastSnapshot).toHaveProperty("collapsedResults");
    expect(lastSnapshot).toHaveProperty("collapsedModelSettings");
    expect(lastSnapshot).toHaveProperty("requestExpanded");
    expect(lastSnapshot).toHaveProperty("responseExpanded");
    expect(lastSnapshot).toHaveProperty("viewTabs");
    expect(lastSnapshot).toHaveProperty("streamingEnabled");

    clearVscMocks(mockVsc);
  });
});
