import { fireEvent, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { ResultsContextValue } from "@/aspects/assessment/hooks/useAssessmentResultsView";
import type { ResultsLayout } from "@/aspects/assessment/persistence";
// import {
//   createRunResult,
//   renderWithAssessmentProviders,
// } from "@/testUtils/assessment";

import { Results } from "../Results";

// const baseResult = createRunResult({
//   runId: "run-1",
//   resultId: "res-1",
//   label: "Result 1",
//   text: "Hello world",
//   request: { foo: "bar" },
//   response: { baz: "qux" },
// });

// const models = [
//   {
//     id: "model-1",
//     name: "Model 1",
//     specification: { provider: "openai" },
//     pricing: { input: 0.001, output: 0.002 } as any,
//   },
// ] as any;

describe.skip("Results", () => {
  const renderComponent = (overrides: Partial<ResultsContextValue> = {}) => {
    return renderWithAssessmentProviders(<Results />, {
      results: {
        results: [baseResult],
        models,
        layout: "vertical" satisfies ResultsLayout,
        onLayoutChange: vi.fn(),
        onToggleCollapse: vi.fn(),
        onToggleModelSettings: vi.fn(),
        onToggleRequest: vi.fn(),
        onToggleResponse: vi.fn(),
        onChangeView: vi.fn(),
        onActiveResultIndexChange: vi.fn(),
        ...overrides,
      },
    });
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
      results: [
        baseResult,
        { ...baseResult, resultId: "res-2", label: "Result 2" },
      ],
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
