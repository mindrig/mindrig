# Add streaming controls and cancellation

## Spec

Introduce UI controls that default streaming on but let users toggle it, persist the preference, expose a stop button during active runs, and keep the run controls synchronized with backend lifecycle events.

## Tasks

- [ ] [Add streaming toggle UI](#add-streaming-toggle-ui): Place a default-checked streaming checkbox beside the run button with explanatory tooltip or label copy.
- [ ] [Persist streaming preference](#persist-streaming-preference): Store the checkbox state via VS Code memento/settings and hydrate it on webview load.
- [ ] [Propagate streaming flag in run payload](#propagate-streaming-flag-in-run-payload): Include the current streaming preference in the `executePrompt` message so the extension can choose streaming vs fallback.
- [ ] [Implement stop button behaviour](#implement-stop-button-behaviour): Add a stop control that appears/enables during active runs and sends cancellation messages using the active run id.
- [ ] [Synchronize run/stop states with lifecycle events](#synchronize-runstop-states-with-lifecycle-events): Update button disabled states based on `promptRunStarted`, `promptRunCompleted`, `promptRunError`, and cancellation acknowledgements.
- [ ] [Handle non-streaming runs gracefully](#handle-non-streaming-runs-gracefully): Ensure the stop button simply discards pending requests when streaming is unavailable while keeping UI feedback consistent.

### Add streaming toggle UI

#### Summary

Expose a user-facing toggle near the run button.

#### Description

- Update the assessment header controls to include a checkbox labeled "Stream output" (or similar) positioned next to the run button.
- Default the control to checked when no prior preference is stored.
- Adjust layout spacing so run/stop buttons and the new checkbox remain compact and responsive.

### Persist streaming preference

#### Summary

Remember the user's selection across sessions.

#### Description

- Use the existing settings context or add a new message to request/store the preference via VS Code's memento API.
- On webview initialization, request the stored value and set the checkbox accordingly.
- Update the stored value whenever the user toggles the checkbox.

### Propagate streaming flag in run payload

#### Summary

Let the extension know whether to stream.

#### Description

- Extend the payload sent in `vsc.postMessage({ type: "executePrompt", payload })` to include `streamingEnabled` (or similar field) reflecting the toggle state.
- Update TypeScript types for the payload in shared definitions so the extension can read the flag.
- Ensure dataset run matrix logic respects the flag without additional per-model overrides for now.

### Implement stop button behaviour

#### Summary

Allow users to cancel in-progress runs.

#### Description

- Add a stop button next to the run button, hidden or disabled when no run is active.
- When clicked during streaming, send a `stopPromptRun` message including the current run id.
- Provide immediate visual feedback (e.g., button disabled, text "Stopping…") while awaiting confirmation from the extension.

### Synchronize run/stop states with lifecycle events

#### Summary

Keep controls in sync with backend status.

#### Description

- On `promptRunStarted`, disable the run button and enable the stop button.
- On `promptRunCompleted`, `promptRunError`, or cancellation acknowledgement, re-enable the run button, disable the stop button, and clear any "stopping" state.
- Handle edge cases where late events arrive for an unknown run id by ignoring them or logging a warning.

### Handle non-streaming runs gracefully

#### Summary

Ensure controls behave well when streaming can't be used.

#### Description

- When the extension indicates streaming is unavailable for the whole run or individual models, keep displaying placeholders but make the stop button act as "Cancel pending" (clearing queued results).
- Confirm the run button state still resets when non-streaming completion or errors occur.
- Surface a brief note or tooltip so users understand why streaming isn't active if the flag was checked.

## Questions

None.

## Notes

- Coordinate label copy with design guidelines; ensure accessibility attributes exist for the checkbox and stop button.
- Consider keyboard shortcuts (e.g., Escape to stop) as a potential follow-up but out of scope for this phase.
