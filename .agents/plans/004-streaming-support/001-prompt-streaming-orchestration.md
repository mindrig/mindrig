# Refactor prompt execution for streaming

## Spec

Rework the extension-side prompt execution pipeline so each run emits nanoid-backed identifiers, uses `streamText` when streaming is enabled, forwards incremental result payloads to the webview, and supports cancellation while preserving non-streaming fallbacks.

## Tasks

- [ ] [Audit current execution request flow](#audit-current-execution-request-flow): Trace how `executePrompt` messages travel through the extension to capture existing payload shapes, attachment handling, and result aggregation.
- [ ] [Introduce run and result id generation](#introduce-run-and-result-id-generation): Pull in `nanoid`, assign run ids per execution and stable result ids per model/run combination, and persist them across lifecycle events.
- [ ] [Adopt streamText in AIService](#adopt-streamtext-in-aiservice): Replace `generateText` with `streamText`, wiring callbacks for partial text, tool calls, and final metadata while preserving attachment support.
- [ ] [Emit streaming lifecycle messages](#emit-streaming-lifecycle-messages): Define and send `promptRunStarted`, `promptRunUpdate`, `promptRunCompleted`, and `promptRunError` messages to the webview with the new identifiers and payload contracts.
- [ ] [Implement cancellation plumbing](#implement-cancellation-plumbing): Track active stream controllers keyed by run id, stop them when requested, and clean up resources on completion or error without leaking handles.
- [ ] [Fallback handling when streaming disabled](#fallback-handling-when-streaming-disabled): Ensure the existing non-streaming aggregation path runs when streaming is off while still sending prompt lifecycle messages expected by the webview.

### Audit current execution request flow

#### Summary

Understand how the extension currently processes `executePrompt` requests and aggregates results.

#### Description

- Inspect `pkgs/vsc-extension/src/WorkbenchView/Provider.ts` for `#handleExecutePrompt` to document payload assembly, looping over model configs, and final message dispatches.
- Review `pkgs/vsc-extension/src/AIService.ts` to note how `generateText` is invoked, especially attachments, reasoning options, and error handling.
- Record the current response shape (`success`, `results`, `error`) in this step file so downstream tasks know what must remain for non-streaming fallbacks.

### Introduce run and result id generation

#### Summary

Generate stable identifiers for runs and individual matrix results.

#### Description

- Add `nanoid` to the extension package dependencies (`pkgs/vsc-extension/package.json`) and import it where identifiers are created.
- In `#handleExecutePrompt`, generate a `runId` per invocation and include it in all messages to the webview.
- While iterating over dataset runs and model configs, derive deterministic `resultId`s (e.g., nanoid per combination) stored alongside metadata so streaming updates can be matched client-side.

### Adopt streamText in AIService

#### Summary

Use the streaming API to produce incremental responses.

#### Description

- Replace `generateText` with `streamText` from the `ai` SDK, ensuring gateway creation still uses the configured API key.
- Wire callback handlers to emit partial text chunks, tool call events, and final results; surface them through a new async iterator or observer returned to `WorkbenchViewProvider`.
- Maintain attachment preprocessing, provider option merging, and error normalization from the existing implementation.

### Emit streaming lifecycle messages

#### Summary

Send structured messages to the webview for each streaming phase.

#### Description

- Define TypeScript interfaces for streaming messages (e.g., in `@wrkspc/vsc-types`) capturing run id, result id, partial text, usage deltas, and completion metadata.
- When a run starts, send `promptRunStarted` with the run id, prompt id, and an array of result shells (model info, result ids, streaming flags).
- On each streaming chunk, send `promptRunUpdate` including run id, result id, chunk text, and any structured data (JSON, tool responses) needed by the webview.
- Upon completion or error, send `promptRunCompleted`/`promptRunError` summarizing final state, usage, and timestamps so the UI can finalize cards and controls.

### Implement cancellation plumbing

#### Summary

Allow the stop button to terminate active streams.

#### Description

- Store abort controllers or cancelable handles for each active `streamText` invocation keyed by run id.
- Handle `stopPromptRun` messages from the webview by invoking the stored controller, sending acknowledgement back if needed.
- Ensure controllers are removed from the registry once a stream ends, whether via completion, error, or cancellation, to avoid leaks.

### Fallback handling when streaming disabled

#### Summary

Preserve the non-streaming execution path when necessary.

#### Description

- When the payload indicates streaming is disabled, keep the existing loop that awaits full results, but still emit the `promptRunStarted` and `promptRunCompleted` messages so the webview shows placeholders immediately.
- Populate result ids in the fallback path to maintain a consistent protocol.
- Confirm error paths continue to send `promptRunError` per result and overall run id for parity with streaming flows.

## Questions

None.

## Notes

- Coordinate message schema updates with the webview step to avoid drift between types and runtime payloads.
- Consider logging run ids and cancellation actions for future telemetry once instrumentation lands in Step 5.
