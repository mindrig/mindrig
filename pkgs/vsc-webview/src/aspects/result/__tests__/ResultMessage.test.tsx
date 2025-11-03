import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { ModelLanguageMessage } from "../../model/LanguageMessage";

describe.skip("ResultMessage", () => {
  it("renders provided label and highlights current view", () => {
    render(
      <ModelLanguageMessage
        label="Response"
        renderedLabel="Rendered"
        currentView="rendered"
        renderedContent={<div data-testid="rendered">Rendered Content</div>}
        rawContent={<div data-testid="raw">Raw Content</div>}
        onChangeView={vi.fn()}
      />,
    );

    expect(screen.getByText("Response")).toBeInTheDocument();
    expect(screen.getByTestId("rendered")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Rendered" })).toHaveClass(
      "font-semibold",
    );
  });

  it("emits view change events when toggles are clicked", async () => {
    const user = userEvent.setup();
    const onChangeView = vi.fn();

    render(
      <ModelLanguageMessage
        label="Response"
        renderedLabel="Rendered"
        currentView="rendered"
        renderedContent={<div />}
        rawContent={<div />}
        onChangeView={onChangeView}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Raw" }));
    expect(onChangeView).toHaveBeenCalledWith("raw");

    await user.click(screen.getByRole("button", { name: "Rendered" }));
    expect(onChangeView).toHaveBeenCalledWith("rendered");
  });
});
