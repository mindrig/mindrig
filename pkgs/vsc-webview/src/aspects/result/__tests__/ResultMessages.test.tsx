import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { describe, expect, it, vi } from "vitest";
// import { createRunResult } from "@/testUtils/assessment";
import { PromptRunResultMessages } from "../../promptRun/ResultMessages";

vi.mock("@uiw/react-json-view", () => ({
  __esModule: true,
  default: ({ value }: { value: unknown }) => (
    <pre data-testid="json-view">{JSON.stringify(value)}</pre>
  ),
}));

vi.mock("@/aspects/assessment/components/StreamingMarkdown", () => ({
  StreamingMarkdown: ({
    text,
    textParts,
    emptyPlaceholder,
  }: {
    text?: string | null;
    textParts?: string[];
    emptyPlaceholder?: ReactNode;
  }) => (
    <div data-testid="streaming-markdown">
      {text && text.length > 0
        ? text
        : textParts && textParts.length > 0
          ? textParts.join("")
          : (emptyPlaceholder ?? null)}
    </div>
  ),
}));

describe.skip("ResultMessages", () => {
  it("renders parsed JSON response when available", () => {
    const result = createRunResult({ text: '{"foo":"bar"}' });

    render(
      <PromptRunResultMessages
        result={result}
        isLoading={false}
        view="rendered"
        onViewChange={vi.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "JSON" })).toBeInTheDocument();
    expect(screen.getByTestId("json-view")).toHaveTextContent('{"foo":"bar"}');
  });

  it("falls back to placeholder copy when no content", async () => {
    const user = userEvent.setup();
    const onViewChange = vi.fn();

    render(
      <PromptRunResultMessages
        result={createRunResult({ text: "" })}
        isLoading={false}
        view="rendered"
        onViewChange={onViewChange}
      />,
    );

    expect(screen.getByText("No output yet.")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Raw" }));
    expect(onViewChange).toHaveBeenCalledWith("raw");
  });
});
