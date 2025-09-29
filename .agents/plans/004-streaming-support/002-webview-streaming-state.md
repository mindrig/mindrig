# Revise webview streaming state

## Spec

Restructure the assessment webview so result cards render immediately with loading indicators, process streaming updates per result id, and gracefully note models that are not streaming while preserving matrix semantics.

## Tasks

- [ ] [Map new extension message contract](#map-new-extension-message-contract): Document the incoming `promptRun*` message shapes and plan state structures that can consume them.
- [ ] [Emit placeholder result shells on run start](#emit-placeholder-result-shells-on-run-start): Initialize assessment state with empty results tied to run/result ids as soon as `promptRunStarted` arrives.
- [ ] [Render streaming progress indicators](#render-streaming-progress-indicators): Add subtle loading affordances to each result card until completion or error.
- [ ] [Integrate streaming updates](#integrate-streaming-updates): Merge `promptRunUpdate` payloads into the corresponding result card, appending markdown text and auxiliary metadata without losing prior chunks.
- [ ] [Handle non-streaming notes and errors](#handle-non-streaming-notes-and-errors): Display informative messages for models flagged as non-streaming or that return errors, ensuring copy is styled appropriately.
- [ ] [Finalize run state on completion or cancellation](#finalize-run-state-on-completion-or-cancellation): Respond to `promptRunCompleted`, `promptRunError`, and cancellation acknowledgements by clearing loading indicators, updating timestamps, and resetting controls as needed.

### Map new extension message contract

#### Summary

Capture the expected message payloads from the extension.

#### Description

- Review the types introduced in Step 1 (likely in `@wrkspc/vsc-types`) and the `postMessage` calls in the extension to confirm field names and optional properties.
- Write a short reference comment or TypeScript type in `pkgs/vsc-webview/src/aspects/assessment/types.ts` (or a new module) so state hooks consume strongly typed events.
- Ensure compatibility with existing message listeners for legacy events during the transition.

### Emit placeholder result shells on run start

#### Summary

Create result cards immediately when a run begins.

#### Description

- Update the `Assessment` component (or a dedicated hook) to listen for `promptRunStarted` and seed state with an array of result objects containing ids, model metadata, and loading status.
- Ensure placeholders render even when streaming is disabled, matching the requirement for immediate feedback.
- Reset any per-run UI state (collapsed panels, text tabs) when the new run id differs from the current one.

### Render streaming progress indicators

#### Summary

Communicate in-progress streaming status for each result.

#### Description

- Add UI elements inside each result card (e.g., spinner, animated dots, progress copy) that stay subtle yet visible.
- Tie indicator visibility to the per-result loading state, clearing it when completion or error arrives.
- Confirm skeletons or placeholders meet design accessibility considerations (e.g., `aria-live` announcements if applicable).

### Integrate streaming updates

#### Summary

Append chunked content and metadata as it arrives.

#### Description

- Extend state management so `promptRunUpdate` merges new text chunks into `result.text`, accumulating markdown while preserving previous content.
- Handle structured fields such as tool call outputs, JSON payloads, or usage metrics by merging or replacing as appropriate.
- Throttle state updates if needed to avoid excessive re-renders (e.g., batching with `requestAnimationFrame`).

### Handle non-streaming notes and errors

#### Summary

Surface explanations for non-streaming scenarios and errors.

#### Description

- Detect when a result is marked `supportsStreaming: false` (or similar flag) and show a note within the placeholder describing that the provider does not stream yet.
- When errors arrive via `promptRunError`, present the message in red text and keep the card visible rather than collapsing it.
- Ensure these states coexist with loading indicators, disabling them appropriately once final state is known.

### Finalize run state on completion or cancellation

#### Summary

Close out run UI state cleanly.

#### Description

- Update handlers for completion and cancellation messages to set `isLoading` to false for all relevant results, store completion timestamps, and trigger any success notifications if needed.
- Reset or maintain selection state (`activeResultIndex`) based on available results after completion.
- Ensure cleanup logic runs when the user stops a run manually, discarding pending updates gracefully.

## Questions

None.

## Notes

- Coordinate placeholder styling with the upcoming Streamdown renderer to avoid conflicting markdown layout adjustments.
- Consider extracting streaming state into a dedicated reducer/hook for easier unit testing and reuse.
