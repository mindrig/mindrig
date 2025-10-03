import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ResultsLayout } from "@/aspects/assessment/persistence";
import type { RunResult } from "@/aspects/assessment/types";

import { Results } from "../Results";

const baseResult: RunResult = {
  success: true,
  runId: "run-1",
  resultId: "res-1",
  label: "Result 1",
  text: "Hello world",
  textParts: [],
  streaming: false,
  isLoading: false,
  nonStreamingNote: null,
  request: { foo: "bar" },
  response: { baz: "qux" },
  usage: { inputTokens: 10, outputTokens: 20 },
  error: null,
  model: {
    key: "model-key",
    id: "model-1",
    providerId: "openai",
    label: "Model 1",
    settings: {
      options: {},
      reasoning: {},
      providerOptions: {},
      tools: null,
      attachments: [],
    },
  },
};

const models = [
  {
    id: "model-1",
    name: "Model 1",
    specification: { provider: "openai" },
    pricing: { input: 0.001, output: 0.002 } as any,
  },
] as any;

describe("Results", () => {
  const renderComponent = (overrides: Partial<Parameters<typeof Results>[0]> = {}) => {
    const props: Parameters<typeof Results>[0] = {
      results: [baseResult],
      layout: "vertical" satisfies ResultsLayout,
      onLayoutChange: vi.fn(),
      collapsedResults: {},
      onToggleCollapse: vi.fn(),
      collapsedModelSettings: {},
      onToggleModelSettings: vi.fn(),
      requestExpanded: {},
      onToggleRequest: vi.fn(),
      responseExpanded: {},
      onToggleResponse: vi.fn(),
      viewTabs: {},
      onChangeView: vi.fn(),
      activeResultIndex: 0,
      onActiveResultIndexChange: vi.fn(),
      timestamp: 0,
      models,
      ...overrides,
    };
    return render(<Results {...props} />);
  };

  it("renders result content in vertical layout", () => {
    renderComponent();
    expect(screen.getByText("Result 1")).toBeInTheDocument();
    expect(screen.getByText("Model Settings"));
  });

  it("invokes layout change callback", () => {
    const onLayoutChange = vi.fn();
    renderComponent({ onLayoutChange });
    fireEvent.click(screen.getByRole("button", { name: "Horizontal" }));
    expect(onLayoutChange).toHaveBeenCalledWith("horizontal");
  });

  it("toggles request visibility via callback", async () => {
    const user = userEvent.setup();
    const onToggleRequest = vi.fn();
    renderComponent({ onToggleRequest });
    await user.click(screen.getByRole("button", { name: "Show request" }));
    expect(onToggleRequest).toHaveBeenCalledWith(0);
  });

  it("handles carousel navigation", () => {
    const onActiveIndexChange = vi.fn();
    renderComponent({
      layout: "carousel",
      results: [baseResult, { ...baseResult, resultId: "res-2", label: "Result 2" }],
      onActiveResultIndexChange: onActiveIndexChange,
    });

    fireEvent.click(screen.getByRole("button", { name: "▶" }));
    expect(onActiveIndexChange).toHaveBeenCalledWith(1);
  });

  it("triggers view change callback", async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();
    renderComponent({ onChangeView });

    await user.click(screen.getByRole("button", { name: "Raw" }));
    expect(onChangeView).toHaveBeenCalledWith(0, "raw");
  });
});
