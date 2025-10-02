# Messaging Baseline Test Plan

## Coverage Priorities

| Domain                 | Flows                                                                                | Risk   | Current Gaps                                                                                        | Coverage Strategy                                                                                                                                                                         |
| ---------------------- | ------------------------------------------------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Sync (CRDT)            | `sync-init`, `sync-state-vector`, `sync-update`                                      | High   | No automated regression beyond unit helpers; CRDT regressions break collaborative editing silently. | Extension: simulate `sync-init` and assert state-vector responses + outbound updates; Webview: verify `useCodeSync` applies updates and emits outbound diffs; add fuzzed payload helpers. |
| Prompt Execution       | `executePrompt`, `promptRun*`, `promptExecutionResult`, `stopPromptRun`              | High   | Streaming orchestration tests rely on mocks but miss payload shape assertions; UI coverage partial. | Extension: capture `postMessage` sequence for run lifecycle; Webview: assert `Assessment` updates streaming state and emits stop requests; ensure error/cancel branches covered.          |
| Settings / Preferences | `settingsUpdated`, `get/setStreamingPreference`                                      | Medium | Settings context only sanity-tested; toggle interactions unverified.                                | Extension: assert preference updates persist in global state and echo responses; Webview: verify `useSettings`, streaming toggle, and checkbox interactions produce payloads.             |
| Auth (Vercel key)      | `set/clear/getVercelGatewayKey`, `vercelGatewayKeyChanged`, `openVercelGatewayPanel` | Medium | Secret manager flows untested; UI state transitions manual.                                         | Extension: stub secret storage to ensure set/clear triggers expected messages; Webview: confirm auth panel renders states and requests secrets on load.                                   |
| Attachments / CSV      | `requestAttachmentPick`, `attachmentsLoaded`, `requestCsvPick`, `csvFileLoaded`      | Medium | File pick flows rely on manual QA; parsing edge cases unguarded.                                    | Extension: simulate requests and s3 returns with error branches; Webview: ensure attachments map to model configs and CSV rows update dataset state.                                      |
| Models Catalog         | `getModelsDev`, `modelsDev`                                                          | Low    | SWR fallback handles most errors but caching semantics fragile.                                     | Extension: assert caching & error fallback; Webview: verify provider/model maps refresh and timeouts handled.                                                                             |

## Acceptance Criteria

- Tests fail if message `type` values change without updates to new typed contracts.
- Baseline suites run via `pnpm test --filter=@wrkspc/vsc-extension` and `pnpm test --filter=@wrkspc/vsc-webview`.
- Helpers expose strongly typed builders under `pkgs/vsc-extension/src/testUtils/messages.ts` and `pkgs/vsc-webview/src/testUtils/messages.ts` with inline docs.
- Critical flows (sync + prompt execution) cover success, failure, and cancellation/timeout scenarios.
- Artifacts document runtime expectations (<60s incremental run per package) and required polyfills.

## Next Actions

1. Implement extension tests for sync + prompt controllers using captured inventory payloads.
2. Add webview tests covering `Assessment` streaming UI and `useCodeSync` updates.
3. Extract shared test helpers while wiring tests into package scripts.

## CI Integration

- Extension suite: `pnpm --filter vscode test/unit` (captured by workspace `pnpm test`).
- Webview suite: `pnpm --filter @wrkspc/vsc-webview test/unit`.
- Both suites execute under `turbo run test`, so CI picks them up without changes.
- Average runtime (local Happy DOM): <1s per package.
