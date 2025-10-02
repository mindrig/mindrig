# Streaming Execution Experience

## Brief

Add incremental prompt execution to the VS Code workbench so prompt results stream into the webview with immediate placeholder cards, controllable streaming, cancellable runs, and Streamdown-based markdown rendering while preserving fallbacks for non-streaming models.

## Steps

- [x] [Refactor Prompt Execution for Streaming](.agents/plans/004-streaming-support/001-prompt-streaming-orchestration.md): Shift the extension's prompt runner to `streamText`, emit run/result identifiers, surface partial payloads, and handle cancellation with graceful fallbacks.
- [x] [Revise Webview Result State](.agents/plans/004-streaming-support/002-webview-streaming-state.md): Rebuild assessment state to emit result shells instantly, consume streaming updates, and note non-streaming models while respecting run matrix semantics.
- [x] [Add Streaming Controls and Cancellation](.agents/plans/004-streaming-support/003-streaming-controls-stop-run.md): Introduce a default-on streaming checkbox, a run-time stop button, and consistent run button states wired to backend run lifecycle events.
- [x] [Adopt Streamdown Markdown Rendering](.agents/plans/004-streaming-support/004-streamdown-markdown-rendering.md): Replace the current markdown renderer with Streamdown to render incremental content and align styling and security.
- [x] [Validate and Document Streaming Flow](.agents/plans/004-streaming-support/005-streaming-validation.md): Cover new streaming protocols with automated tests, update specs, and note operational considerations.

### [Refactor Prompt Execution for Streaming](.agents/plans/004-streaming-support/001-prompt-streaming-orchestration.md)

Rework `WorkbenchViewProvider.#handleExecutePrompt` and `AIService` so each run assigns a nanoid-based run id and per-result ids, uses `streamText` for enabled runs, forwards `promptRunStarted`, `promptRunUpdate`, `promptRunCompleted`, and `promptRunError` messages to the webview, and tracks cancellable handles keyed by run id. Ensure attachments, dataset runs, and non-streaming fallbacks still succeed when streaming is disabled.

#### Status

Extension-side streaming pipeline is live with shared message contracts, cancellation plumbing, and a compatible non-streaming fallback; no remaining deferrals for this step.

### [Revise Webview Result State](.agents/plans/004-streaming-support/002-webview-streaming-state.md)

Restructure `Assessment` state to create result cards immediately upon run start, show subtle loading indicators, display "model does not support streaming" notes when flagged by the backend, merge streaming deltas into the right card via result ids, and clear state correctly between runs or when streaming is disabled.

#### Status

Webview now mirrors the extension's streaming protocol, emitting placeholders, live updates, cancellation handling, and non-streaming notices while maintaining compatibility with the legacy `promptExecutionResult` flow.

### [Add Streaming Controls and Cancellation](.agents/plans/004-streaming-support/003-streaming-controls-stop-run.md)

Add a default-checked streaming checkbox beside the run button, persist and propagate the choice in run payloads, expose a stop button that cancels active run ids (or discards pending queues when streaming is off), and keep run/stop controls synchronized with backend lifecycle events.

#### Status

Workbench controls now surface a persisted streaming toggle, responsive stop button, and synced run states that honor cancellation paths and disabled-streaming fallbacks end to end.

### [Adopt Streamdown Markdown Rendering](.agents/plans/004-streaming-support/004-streamdown-markdown-rendering.md)

Bring in Streamdown, swap out `@uiw/react-markdown-preview`, set up streaming markdown components for incremental updates, and adjust styling, syntax highlighting, and sanitization to match existing UX expectations.

#### Status

Streamdown now renders streamed markdown with restricted link/image prefixes, tailored webview styling, and placeholder handling for in-flight results; no open items remain for this step.

### [Validate and Document Streaming Flow](.agents/plans/004-streaming-support/005-streaming-validation.md)

Create tests covering streaming messages, cancellation, and non-streaming fallback paths across extension and webview layers; update developer docs/specs with the new message protocol and dependencies; and outline telemetry or logging needed for troubleshooting.

#### Status

Extension and webview tests now cover streaming lifecycles, documentation in `docs/contributing/streaming.md` explains the protocol and controls, telemetry/QA follow-ups are captured, and the run pipeline now respects the `mindrig.run.parallel` concurrency limit while emitting per-result completion messages so UI indicators clear promptly (webview test suite still needs the KaTeX CSS loader fix to run end to end).

## Questions

### Streaming Preference Persistence

Should the streaming-enabled checkbox remember the last user choice (e.g., via VS Code memento or settings) or reset to enabled on every session?

#### Answer

Remember the preference via the VS Code memento (or equivalent persisted setting) so the checkbox restores the last user choice while still defaulting to enabled for first-time runs.

## Notes

Assume all active model/provider combinations can stream for now while leaving room to surface backend flags later. Coordinate message schemas (`promptRun*`) between extension and webview before coding to minimize churn.

## Prompt

I want you to plan streaming feature.

Right now when a prompt is run, the user needs to wait until they see the results. If there's multiple dataset rows and model configurations, it takes a long time even though some results might be ready already. On top of that, users nowadays expect streaming by default.

We need to add streaming support. When user runs prompt, the empty result cards must display immediately with a subtle indicator that the streaming is in progress.

It is possible that not all models, providers or gateways will support streaming, so for those display empty result for each item in the matrix with a loading indicator and a note that this model doesn't support streaming.

Make the streaming optional but enabled by default. Add a checkbox for it next to run button. However even if the streaming is disabled or unavailable, the empty result cards must still display immediately with a loading indicator.

Use `streamText` for all requests if it is enabled for the run. For now we will assume that all models support streaming. If we find out that some models don't support streaming, we can handle that later.

To implement, make sure to assign a random run id using nanoid (https://www.npmjs.com/package/nanoid) as well as ids to each of the matrix results. Rather than waiting for the entire response, send streaming updates to the webview using the ids to identify which result to update.

When the streaming is done, remove the loading indicator and change the run button state to enabled. If there's an error, display the error message in red text for each result that failed.

Add stop button next to the run button that is enabled when run is in progress. When clicked, it should stop all streaming requests and change the run button state to enabled. It should be communicated to the backend using the run id. If streaming is disabled for whole run or particular model, the stop button should simply discard pending requests.

Use Streamdown (https://github.com/vercel/streamdown) to render Markdowns instead of whatever we're using right now as it supports streaming.
