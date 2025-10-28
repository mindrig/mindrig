import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { AssessmentRun } from "../Run";

describe.skip("AssessmentRun", () => {
  const baseProps = {
    canRunPrompt: true,
    runInFlight: false,
    isStopping: false,
    showStopButton: false,
    stopDisabled: false,
    streamingEnabled: true,
    streamingToggleId: "stream-toggle",
    hasResultsOrError: false,
    onExecute: vi.fn(),
    onStop: vi.fn(),
    onClear: vi.fn(),
    onStreamingToggle: vi.fn(),
  } satisfies Parameters<typeof AssessmentRun>[0];

  it("disables run button when prompt cannot run", () => {
    render(<AssessmentRun {...baseProps} canRunPrompt={false} />);

    expect(screen.getByRole("button", { name: "Run Prompt" })).toBeDisabled();
  });

  it("shows stop and clear controls when appropriate", async () => {
    const user = userEvent.setup();
    const onStop = vi.fn();
    const onClear = vi.fn();

    render(
      <AssessmentRun
        {...baseProps}
        showStopButton
        hasResultsOrError
        onStop={onStop}
        onClear={onClear}
      />,
    );

    await user.click(screen.getByRole("button", { name: "Stop" }));
    expect(onStop).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Clear" }));
    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it("invokes streaming toggle callback", () => {
    const onStreamingToggle = vi.fn();

    render(
      <AssessmentRun {...baseProps} onStreamingToggle={onStreamingToggle} />,
    );

    const checkbox = screen.getByRole("checkbox", { name: "Stream output" });
    fireEvent.click(checkbox);
    expect(onStreamingToggle).toHaveBeenCalledWith(false);
  });
});
