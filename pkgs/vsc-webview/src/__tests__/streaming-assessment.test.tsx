import type { Prompt } from "@mindrig/types";
import { act, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Assessment } from "../aspects/assessment/Assessment";
import { VscContext } from "../aspects/vsc/Context";

vi.mock("../aspects/assessment/hooks/useGatewayModels", () => ({
  useGatewayModels: () => ({
    models: [],
    isLoading: false,
    isValidating: false,
    error: null,
    isFallback: false,
    mutate: vi.fn(),
  }),
}));

vi.mock("../aspects/models-dev/Context", () => ({
  useModelsDev: () => ({
    getModel: vi.fn(),
    providers: [],
    isFallback: false,
    isLoading: false,
    error: null,
  }),
}));

vi.mock("@wrkspc/dataset", () => ({
  buildRunsAndSettings: vi.fn(() => ({ runs: [], runSettings: {} })),
  computeVariablesFromRow: vi.fn(() => ({})),
}));

vi.mock("@wrkspc/ds", () => ({
  Button: ({ children, onClick }: any) => (
    <button onClick={onClick}>{children}</button>
  ),
  Select: ({ children, options, style, ...props }: any) => (
    <select>
      {options.map((option: any) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  ),
}));

vi.mock("../aspects/assessment/components/ModelStatusDot", () => ({
  ModelStatusDot: () => null,
}));

vi.mock("../aspects/assessment/persistence", () => ({
  loadPromptState: () => null,
  savePromptState: vi.fn(),
  PersistedPromptState: {},
}));

vi.mock("@wrkspc/model", () => ({
  selectedModelCapabilities: () => ({
    supportsImages: false,
    supportsVideo: false,
    supportsFiles: false,
    supportsTools: false,
    supportsReasoning: false,
    provider: "",
  }),
  filterAttachmentsForCapabilities: (attachments: any) => attachments,
  mergeProviderOptionsWithReasoning: (options: any) => options,
  providerFromEntry: () => "provider",
  providerLogoUrl: () => "",
}));

vi.mock("@wrkspc/prompt", () => ({
  extractPromptText: () => "",
  substituteVariables: (_text: string, _vars: any) => "",
}));

vi.mock("smolcsv", () => ({
  parseString: () => ({ header: [], rows: [] }),
}));

vi.mock("../aspects/assessment/modelSorting", () => ({
  compareProviderModelEntries: () => 0,
  computeRecommendationWeightsForProvider: () => ({}),
  modelKeyFromId: (id: string) => id,
  normaliseProviderId: (id: string | null | undefined) => id ?? "",
  OFFLINE_MODEL_RECOMMENDATIONS: {},
  parseLastUpdatedMs: () => 0,
  PROVIDER_POPULARITY: {},
}));

vi.mock("@uiw/react-json-view", () => ({
  __esModule: true,
  default: ({ value }: { value: unknown }) => (
    <pre data-testid="json-view">{JSON.stringify(value)}</pre>
  ),
}));

vi.mock("../aspects/assessment/components/StreamingMarkdown", () => ({
  StreamingMarkdown: ({
    text,
    textParts,
  }: {
    text?: string | null;
    textParts?: string[];
  }) => (
    <div data-testid="streaming-markdown">
      {(text ?? "") || textParts?.join("") || ""}
    </div>
  ),
}));

const mockVsc = {
  postMessage: vi.fn(),
  getState: vi.fn(),
  setState: vi.fn(),
};

const prompt: Prompt = {
  file: "/tmp/prompt.md",
  span: {
    outer: { start: 0, end: 120 },
    inner: { start: 0, end: 120 },
  },
  exp: "Test prompt",
  vars: [],
};

const promptId = `${prompt.file}:${prompt.span.outer.start}-${prompt.span.outer.end}`;

const modelInfo = {
  key: "model-key",
  id: "model-id",
  providerId: "provider",
  label: "Model",
  settings: {
    options: {},
    reasoning: { enabled: false, effort: "medium", budgetTokens: "" },
    providerOptions: null,
    tools: null,
    attachments: [],
  },
};

function renderAssessment() {
  return render(
    <VscContext.Provider value={{ vsc: mockVsc }}>
      <Assessment
        prompt={prompt}
        vercelGatewayKey={null}
        fileContent={"Prompt body"}
        promptIndex={0}
      />
    </VscContext.Provider>,
  );
}

describe("Assessment streaming UI", () => {
  beforeEach(() => {
    mockVsc.postMessage.mockReset();
  });

  it("renders streamed markdown updates", async () => {
    renderAssessment();

    const runId = "run-1";
    const resultId = "result-1";

    await act(async () => {
      window.postMessage({
        type: "promptRunStarted",
        payload: {
          runId,
          promptId,
          timestamp: Date.now(),
          streaming: true,
          results: [
            {
              resultId,
              label: "Model • Run 1",
              runLabel: "Run 1",
              model: modelInfo,
              streaming: true,
            },
          ],
          runSettings: { streaming: { enabled: true } },
        },
      });
    });

    expect(await screen.findByText("Streaming…")).toBeInTheDocument();

    await act(async () => {
      window.postMessage({
        type: "promptRunUpdate",
        payload: {
          runId,
          promptId,
          resultId,
          timestamp: Date.now(),
          delta: { type: "text", text: "Hello" },
        },
      });
    });

    expect(await screen.findByText("Hello")).toBeInTheDocument();

    await act(async () => {
      window.postMessage({
        type: "promptRunResultCompleted",
        payload: {
          runId,
          promptId,
          timestamp: Date.now(),
          result: {
            resultId,
            success: true,
            prompt: "Prompt body",
            text: "Hello world",
            label: "Model • Run 1",
            runLabel: "Run 1",
            model: modelInfo,
          },
        },
      });
    });

    await act(async () => {
      await Promise.resolve();
    });

    await waitFor(() => {
      expect(screen.queryByText("Streaming…")).toBeNull();
    });

    await act(async () => {
      window.postMessage({
        type: "promptRunCompleted",
        payload: {
          runId,
          promptId,
          timestamp: Date.now(),
          success: true,
          results: [
            {
              resultId,
              success: true,
              prompt: "Prompt body",
              text: "Hello world",
              label: "Model • Run 1",
              runLabel: "Run 1",
              model: modelInfo,
            },
          ],
        },
      });
    });

    expect(await screen.findByText("Hello world")).toBeInTheDocument();
  });

  it("does not show non-streaming note when streaming disabled", async () => {
    renderAssessment();

    const runId = "run-non-stream";
    const resultId = "result-non-stream";

    await act(async () => {
      window.postMessage({
        type: "promptRunStarted",
        payload: {
          runId,
          promptId,
          timestamp: Date.now(),
          streaming: false,
          results: [
            {
              resultId,
              label: "Model • Run 1",
              runLabel: "Run 1",
              model: modelInfo,
              streaming: false,
            },
          ],
          runSettings: { streaming: { enabled: false } },
        },
      });
    });

    expect(
      screen.queryByText(
        "Streaming is unavailable. Results will appear when the run completes.",
      ),
    ).toBeNull();

    await act(async () => {
      window.postMessage({
        type: "promptRunResultCompleted",
        payload: {
          runId,
          promptId,
          timestamp: Date.now(),
          result: {
            resultId,
            success: true,
            prompt: "Prompt body",
            text: "finished",
            label: "Model • Run 1",
            runLabel: "Run 1",
            model: modelInfo,
          },
        },
      });
    });

    await waitFor(() => {
      expect(
        screen.queryByText(
          "Streaming is unavailable. Results will appear when the run completes.",
        ),
      ).toBeNull();
    });
  });

  it("shows result errors", async () => {
    renderAssessment();

    const runId = "run-err";
    const resultId = "result-err";

    await act(async () => {
      window.postMessage({
        type: "promptRunStarted",
        payload: {
          runId,
          promptId,
          timestamp: Date.now(),
          streaming: true,
          results: [
            {
              resultId,
              label: "Model • Run 1",
              runLabel: "Run 1",
              model: modelInfo,
              streaming: true,
            },
          ],
          runSettings: { streaming: { enabled: true } },
        },
      });
    });

    await act(async () => {
      window.postMessage({
        type: "promptRunError",
        payload: {
          runId,
          promptId,
          resultId,
          timestamp: Date.now(),
          error: "Boom",
        },
      });
    });

    await act(async () => {
      window.postMessage({
        type: "promptRunResultCompleted",
        payload: {
          runId,
          promptId,
          timestamp: Date.now(),
          result: {
            resultId,
            success: false,
            prompt: "Prompt body",
            text: null,
            label: "Model • Run 1",
            runLabel: "Run 1",
            error: "Boom",
            model: modelInfo,
          },
        },
      });
    });

    expect(await screen.findByText("Boom")).toBeInTheDocument();
  });
});
