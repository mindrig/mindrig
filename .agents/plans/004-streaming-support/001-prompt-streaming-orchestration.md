# Refactor prompt execution for streaming

## Spec

Rework the extension-side prompt execution pipeline so each run emits nanoid-backed identifiers, uses `streamText` when streaming is enabled, forwards incremental result payloads to the webview, and supports cancellation while preserving non-streaming fallbacks.

## Tasks

- [x] [Audit current execution request flow](#audit-current-execution-request-flow): Trace how `executePrompt` messages travel through the extension to capture existing payload shapes, attachment handling, and result aggregation.
- [x] [Introduce run and result id generation](#introduce-run-and-result-id-generation): Pull in `nanoid`, assign run ids per execution and stable result ids per model/run combination, and persist them across lifecycle events.
- [x] [Adopt streamText in AIService](#adopt-streamtext-in-aiservice): Replace `generateText` with `streamText`, wiring callbacks for partial text, tool calls, and final metadata while preserving attachment support.
- [x] [Emit streaming lifecycle messages](#emit-streaming-lifecycle-messages): Define and send `promptRunStarted`, `promptRunUpdate`, `promptRunCompleted`, and `promptRunError` messages to the webview with the new identifiers and payload contracts.
- [x] [Implement cancellation plumbing](#implement-cancellation-plumbing): Track active stream controllers keyed by run id, stop them when requested, and clean up resources on completion or error without leaking handles.
- [x] [Fallback handling when streaming disabled](#fallback-handling-when-streaming-disabled): Ensure the existing non-streaming aggregation path runs when streaming is off while still sending prompt lifecycle messages expected by the webview.

### Audit current execution request flow

#### Summary

Understand how the extension currently processes `executePrompt` requests and aggregates results.

#### Description

- Inspect `pkgs/vsc-extension/src/WorkbenchView/Provider.ts` for `#handleExecutePrompt` to document payload assembly, looping over model configs, and final message dispatches.
- Review `pkgs/vsc-extension/src/AIService.ts` to note how `generateText` is invoked, especially attachments, reasoning options, and error handling.
- Record the current response shape (`success`, `results`, `error`) in this step file so downstream tasks know what must remain for non-streaming fallbacks.

#### Findings

- `WorkbenchViewProvider.#handleExecutePrompt` clones the payload, verifies the Vercel Gateway key, normalizes runs and model configs, and iterates every model/run pair sequentially. Each pass awaits `AIService.executePrompt` before pushing an entry into `aggregatedResults`.
- The webview currently receives a single `promptExecutionResult` message containing `{ success: boolean; results: AggregatedResult[]; promptId: string; timestamp: number; runSettings?: unknown; error?: string }`. Error cases still send the message with an empty `results` array and a formatted `error` string.
- An `AggregatedResult` includes `{ success, request, response, usage, totalUsage, text, prompt, label, runLabel, error, model }`, where `model` carries `{ key, id, providerId, label, settings }` and `settings` preserves `options`, `reasoning`, `providerOptions`, `tools`, and raw `attachments` metadata.
- `AIService.executePrompt` builds a gateway model via `createGateway`, forwards option fields verbatim to `generateText`, and converts attachments into `messages` parts—images become binary image parts while other files inline as text with fallbacks for opaque binaries.
- The AI service returns `{ success: true; request; response; usage; totalUsage; text }` on success, with `response` omitting the assistant messages payload. Failures bubble up as `{ success: false; error: "Failed to execute prompt: …" }`, which the provider surfaces unchanged in `aggregatedResults`.

### Introduce run and result id generation

#### Summary

Generate stable identifiers for runs and individual matrix results.

#### Description

- Add `nanoid` to the extension package dependencies (`pkgs/vsc-extension/package.json`) and import it where identifiers are created.
- In `#handleExecutePrompt`, generate a `runId` per invocation and include it in all messages to the webview.
- While iterating over dataset runs and model configs, derive deterministic `resultId`s (e.g., nanoid per combination) stored alongside metadata so streaming updates can be matched client-side.

#### Implementation Notes

- Added `nanoid` as an extension dependency and import, then generate a `runId` at the top of `WorkbenchViewProvider.#handleExecutePrompt`. The id now accompanies every `promptExecutionResult` payload, including early error exits.
- Each model/run combination now receives a `resultId` before invocation so aggregated results include `{ resultId, ... }` entries, preserving existing metadata for non-streaming consumption while preparing for delta updates.

### Adopt streamText in AIService

#### Summary

Use the streaming API to produce incremental responses.

#### Description

- Replace `generateText` with `streamText` from the `ai` SDK, ensuring gateway creation still uses the configured API key.
- Wire callback handlers to emit partial text chunks, tool call events, and final results; surface them through a new async iterator or observer returned to `WorkbenchViewProvider`.
- Maintain attachment preprocessing, provider option merging, and error normalization from the existing implementation.

#### Implementation Notes

- `AIService.executePrompt` now accepts runtime streaming options, builds `streamText` payloads, and forwards chunk callbacks so extension layers can react to text deltas or tool messages in real time.
- Streaming runs accumulate output incrementally while capturing the final `onFinish` metadata (request, response, usage, steps) and fall back to post-stream introspection when the finish hook is unavailable.
- Existing attachment marshalling and error normalization were retained, and `generateText` usage has been removed in favor of the unified streaming pathway.

### Emit streaming lifecycle messages

#### Summary

Send structured messages to the webview for each streaming phase.

#### Description

- Define TypeScript interfaces for streaming messages (e.g., in `@wrkspc/vsc-types`) capturing run id, result id, partial text, usage deltas, and completion metadata.
- When a run starts, send `promptRunStarted` with the run id, prompt id, and an array of result shells (model info, result ids, streaming flags).
- On each streaming chunk, send `promptRunUpdate` including run id, result id, chunk text, and any structured data (JSON, tool responses) needed by the webview.
- Upon completion or error, send `promptRunCompleted`/`promptRunError` summarizing final state, usage, and timestamps so the UI can finalize cards and controls.

#### Implementation Notes

- Added shared streaming message contracts to `@wrkspc/vsc-types`, covering result shells, update deltas, completion payloads, and error envelopes so both extension and webview consume the same schema.
- `WorkbenchViewProvider.#handleExecutePrompt` now orchestrates runs around a generated `runId`, emits `promptRunStarted` placeholders, streams `promptRunUpdate` text deltas, and wraps final aggregates in a `promptRunCompleted` dispatch while still emitting the legacy `promptExecutionResult` for compatibility.
- Streaming failures surface through `promptRunError` with consistent normalization, and the new helper keeps friendly error messaging aligned with the previous non-streaming flow.

### Implement cancellation plumbing

#### Summary

Allow the stop button to terminate active streams.

#### Description

- Store abort controllers or cancelable handles for each active `streamText` invocation keyed by run id.
- Handle `stopPromptRun` messages from the webview by invoking the stored controller, sending acknowledgement back if needed.
- Ensure controllers are removed from the registry once a stream ends, whether via completion, error, or cancellation, to avoid leaks.

#### Implementation Notes

- Added `#activeRunControllers`/`#cancelledRuns` bookkeeping in the workbench provider so each run maintains a live `AbortController` while its current job executes.
- New `stopPromptRun` message handling aborts the active controller, flags the run as cancelled, and the execution loop checks these flags to break out and prevent queued requests from issuing.
- Controllers and cancellation flags are cleared on completion, error, and early-stop paths to avoid leaks, while cancellation responses emit the same lifecycle messages (`promptRunError`/`promptRunCompleted`) the UI expects.

### Fallback handling when streaming disabled

#### Summary

Preserve the non-streaming execution path when necessary.

#### Description

- When the payload indicates streaming is disabled, keep the existing loop that awaits full results, but still emit the `promptRunStarted` and `promptRunCompleted` messages so the webview shows placeholders immediately.
- Populate result ids in the fallback path to maintain a consistent protocol.
- Confirm error paths continue to send `promptRunError` per result and overall run id for parity with streaming flows.

#### Implementation Notes

- `streamingEnabled` now gates streaming handlers only; the execution loop still awaits complete responses and emits `promptRunStarted`/`promptRunCompleted` even when deltas are suppressed.
- Non-streaming runs reuse the same aggregated result builder as before, preserving `resultId`, model metadata, and compatibility `promptExecutionResult` payloads for the legacy UI.
- Cancellation and error dispatchers operate regardless of streaming state, so fallback runs still surface `promptRunError` events when failures occur.

## Questions

None.

## Notes

- Coordinate message schema updates with the webview step to avoid drift between types and runtime payloads.
- Consider logging run ids and cancellation actions for future telemetry once instrumentation lands in Step 5.
