# Streaming Prompt Execution

Mind Rig now streams prompt runs from the VS Code extension into the workbench webview. This document captures the message protocol, UI affordances, and sanitisation rules that keep the flow consistent between the extension (`pkgs/vsc-extension`) and the webview (`pkgs/vsc-webview`).

## Message Protocol

### `promptRunStarted`

- Emitted by `WorkbenchViewProvider.#handleExecutePrompt` when a run begins.
- Payload fields: `runId`, `promptId`, `timestamp`, `streaming` flag, `results` array of result shells (each with `resultId`, `label`, `runLabel`, and `model` metadata), and `runSettings` (currently `{ streaming: { enabled: boolean } }`).
- The webview seeds placeholder result cards immediately and stores `runId` so later updates can be correlated.

### `promptRunUpdate`

- Fired for each streamed delta when streaming is enabled.
- Payload fields: `runId`, `promptId`, `resultId`, `timestamp`, and `delta`. The webview currently handles `delta.type === "text"` by appending `delta.text` to the active result via `appendTextChunk`.
- Updates are ignored if `promptId` or `resultId` do not match the active run, protecting against stale events.

### `promptRunCompleted`

- Issued after all jobs finish or a run is cancelled.
- Payload fields: `runId`, `promptId`, `timestamp`, `success`, and `results` containing the final result summaries (`PromptRunResultData`).
- The extension also mirrors the aggregated payload through `promptExecutionResult` to satisfy the legacy non-streaming UI.

### `promptRunError`

- Raised for run-wide failures (no `resultId`) or scoped result errors (includes `resultId`).
- When the error is scoped, the webview marks the specific result as failed and stops showing the spinner. When run-wide, every result is marked non-loading and the error banner is shown under the run controls.

### Streaming preference round-trip

- The webview asks for persisted state via `getStreamingPreference`; the extension replies with `{ enabled: boolean }` from its `globalState` memento (`mindrig.workbench.streamingEnabled`).
- When the user toggles the checkbox, the webview sends `setStreamingPreference` with the new value so the extension can persist it.

### Cancellation

- The stop button posts `stopPromptRun` with the current `runId`.
- The extension aborts the active `AbortController`, adds the `runId` to its cancellation set, and ultimately delivers a `promptRunError` with `"Prompt run cancelled."` alongside a `promptRunCompleted` payload where `success` is `false`.

## Workbench Controls

- **Stream output**: Checkbox rendered beside the run button. It defaults to checked, honours the persisted preference on mount, and is included in run payloads as `streamingEnabled` / `runSettings.streaming.enabled`.
- **Stop**: Button appears while a run is in-flight, disabled until `promptRunStarted` arrives. When clicked it sends `stopPromptRun`, disables itself, and resets once the extension confirms cancellation or completion.
- **Placeholders**: Each result card shows either “Streaming…” or “Waiting for result…” (for non-streaming models). A non-streaming note is surfaced when the extension flags `streaming: false` on a shell.
- **Parallelism**: `mindrig.run.parallel` (default `4`) controls how many requests execute concurrently. The extension uses a bounded queue, so lowering the value throttles provider load while still streaming results as they complete.

## Markdown Rendering

- Streamed markdown is rendered by the `StreamingMarkdown` component, which wraps [Streamdown](https://github.com/vercel/streamdown).
- Links and images are restricted to safe prefixes (`https://`, `http://`, and `mailto:` for anchors; only `http`/`https` for images) on top of Streamdown’s hardening via `harden-react-markdown` to reduce XSS risk.
- A placeholder message is shown until the first delta arrives; once content exists the Markdown/Raw tabs allow switching between the formatted Streamdown view and the raw text.

## Testing Overview

- Extension message flow is covered by `pkgs/vsc-extension/src/__tests__/streaming-orchestration.test.ts`, which mocks `AIService.executePrompt` to assert start/update/completion/error sequencing and cancellation behaviour.
- Webview state updates are validated by `pkgs/vsc-webview/src/__tests__/streaming-assessment.test.tsx`, which dispatches synthetic `promptRun*` messages into the `Assessment` component and checks placeholders, streamed markdown, and error rendering.
- Running `pnpm --filter vscode test/unit` now executes the new extension tests; running `pnpm --filter vsc-webview test/unit` is still blocked by a pre-existing KaTeX CSS loader issue (tracked in the test notes) but the new streaming test passes when run in isolation.

## Telemetry and Troubleshooting

- **Logging**: emit `promptRunStarted`, `promptRunCompleted`, and `promptRunError` traces with `runId`, `promptId`, and `resultId` (when available) so backend pipelines can correlate runs. Record cancellation sources (user stop vs. transport abort) to separate user actions from network issues.
- **Metrics**: track time-to-first-token (`promptRunUpdate` timestamp minus `promptRunStarted`), overall run duration, and per-result success rates. These help surface regressions when providers change behaviour.
- **Manual QA**: verify streaming on/off toggles, stop button recovery, multi-result streaming, and non-streaming fallback (`streaming: false` shells). Confirm the persisted toggle state survives reloads.
- **Follow-ups**: add per-model streaming capability detection and surface `nonStreamingNote` directly from the extension when gateways indicate lack of support.
