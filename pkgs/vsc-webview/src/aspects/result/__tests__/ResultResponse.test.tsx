import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { PromptRunResultResoponse } from "../../promptRun/ResultResponse";

vi.mock("@uiw/react-json-view", () => ({
  __esModule: true,
  default: ({ value }: { value: unknown }) => (
    <pre data-testid="json-view">{JSON.stringify(value)}</pre>
  ),
}));

describe.skip("ResultResponse", () => {
  it("returns null when no response is provided", () => {
    const { container } = render(
      <PromptRunResultResoponse
        response={null}
        expanded={false}
        onToggle={vi.fn()}
      />,
    );
    expect(container.firstChild).toBeNull();
  });

  it("renders toggle button and expands when requested", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();

    render(
      <PromptRunResultResoponse
        response={{ foo: "bar" }}
        expanded={false}
        onToggle={onToggle}
      />,
    );

    const toggle = screen.getByRole("button", { name: "Show response" });
    expect(toggle).toBeInTheDocument();

    await user.click(toggle);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("displays JSON view when expanded", () => {
    render(
      <PromptRunResultResoponse
        response={{ foo: "bar" }}
        expanded
        onToggle={vi.fn()}
      />,
    );

    expect(screen.getByTestId("json-view")).toHaveTextContent('{"foo":"bar"}');
  });
});
