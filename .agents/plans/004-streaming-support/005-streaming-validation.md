# Validate and document streaming flow

## Spec

Add automated coverage and documentation for the new streaming execution flow, including extension-side message handling, webview state updates, and operational considerations.

## Tasks

- [ ] [Identify existing test harnesses](#identify-existing-test-harnesses): Review available unit, integration, and end-to-end test setups to determine where streaming coverage fits best while avoiding known flaky suites.
- [ ] [Disable legacy flaky suites](#disable-legacy-flaky-suites): Temporarily skip/?disable the e2e extension tests and current webview unit suites to unblock focused streaming work.
- [ ] [Test extension streaming orchestration](#test-extension-streaming-orchestration): Add unit/integration tests that simulate streaming runs, verify lifecycle messages, and assert cancellation behaviour.
- [ ] [Test webview streaming state updates](#test-webview-streaming-state-updates): Write testing-library/-powered React component tests (with happydom) ensuring placeholders, updates, and completion states render correctly.
- [ ] [Document streaming protocol and controls](#document-streaming-protocol-and-controls): Update specs or developer docs with message schemas, control behaviour, and persistence details.
- [ ] [Outline telemetry and troubleshooting notes](#outline-telemetry-and-troubleshooting-notes): Capture recommended logging, metrics, and manual QA steps for future follow-up.

### Identify existing test harnesses

#### Summary

Determine where to add coverage while avoiding flaky suites.

#### Description

- Inspect `pnpm-workspace.yaml` and existing test directories (e.g., `pkgs/vsc-extension/tests`, `pkgs/vsc-webview/src/__tests__`) to confirm available harnesses (Vitest, etc.).
- Explicitly skip or disable the flaky end-to-end extension tests per newest guidance.
- Plan to rely on extension unit/integration tests and React component tests powered by Testing Library + happydom.
- Document harness decisions in this step file before implementing tests.

### Disable legacy flaky suites

#### Summary

Ensure unstable suites do not block streaming development.

#### Description

- Mark the e2e extension tests as skipped or disabled (e.g., via `describe.skip` or config) so CI ignores them during streaming work.
- Temporarily disable the existing webview unit test suites, noting the change in this plan step and linking to follow-up tasks to re-enable once stabilised.
- Coordinate with the team on how to track re-enabling (issue, TODO) so the regression debt is visible.

### Test extension streaming orchestration

#### Summary

Ensure lifecycle messages are emitted correctly.

#### Description

- Add tests (likely Vitest or integration harness) that mock `streamText` to emit controlled chunks and verify `promptRunStarted`, `promptRunUpdate`, `promptRunCompleted`, and `promptRunError` are dispatched in order.
- Simulate cancellation by invoking the stop handler and confirm active streams are aborted and completion messages reflect the cancellation state.
- Cover the non-streaming fallback path to ensure message compatibility.

### Test webview streaming state updates

#### Summary

Validate UI state transitions in response to streaming events.

#### Description

- Create React component or hook tests using Testing Library with happydom that feed synthetic `promptRun*` events and assert that placeholders, loading indicators, streamed text, and error notes render as expected.
- Check that cancellation resets the run button state and that the streaming toggle persists across renders when stored preferences change.
- Verify Streamdown integration renders incremental content without throwing.

### Document streaming protocol and controls

#### Summary

Communicate new behaviour to contributors and users.

#### Description

- Update relevant docs (e.g., `docs/prompt-execution.md` or README sections) describing the run id/result id protocol, streaming toggle, stop button, and placeholders.
- Include details on how to enable/disable streaming, what happens when providers lack support, and any known limitations.
- Ensure documentation reflects the persisted streaming preference decision.

### Outline telemetry and troubleshooting notes

#### Summary

Prepare for operational follow-up.

#### Description

- Draft notes on recommended logging (e.g., run id correlation, cancellation events) and where to surface them once telemetry infrastructure is ready.
- Provide a short manual QA checklist for verifying streaming in development builds.
- Highlight open questions or future work (e.g., per-model streaming capability detection) for later tracking.

## Questions

None.

## Notes

- Coordinate with Step 1 and Step 2 owners to reuse test fixtures or message mocks where possible.
- Consider gating new tests behind feature flags if the streaming protocol is introduced incrementally.
