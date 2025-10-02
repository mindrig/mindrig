# Baseline message tests

## Spec

Add safety nets that capture current extension↔webview messaging behavior before refactors, including reusable helpers that make future message assertions easy to write.

## Tasks

- [x] [Prioritize behaviors for coverage](#prioritize-behaviors-for-coverage): Decide which message flows must be locked down ahead of refactors.
- [x] [Author extension messaging tests](#author-extension-messaging-tests): Create Jest/Vitest suites that simulate webview messaging and verify extension side effects.
- [x] [Author webview messaging tests](#author-webview-messaging-tests): Add React-focused tests that exercise message handlers and resulting UI state updates.
- [x] [Extract reusable test harness utilities](#extract-reusable-test-harness-utilities): Factor common message send/receive helpers into shared modules.
- [x] [Integrate suites into CI](#integrate-suites-into-ci): Ensure the new tests run in existing pipelines and document how to execute them locally.

### Prioritize behaviors for coverage

#### Summary

Select the highest risk message flows that must be preserved during consolidation.

#### Description

- Review the inventory artifact from Step 1 to rank messages by criticality (CRDT sync, prompt execution, settings updates, auth flows, telemetry).
- Note any fragile areas (e.g., CRDT reconnect, streaming prompts) that lack existing tests and capture acceptance criteria in `.agents/plans/006-messages-consolidation/artifacts/test-plan.md`.
- Identify whether coverage should focus on extension outbound messages, inbound handlers, or both for each domain.

### Author extension messaging tests

#### Summary

Simulate the webview to validate extension message senders and handlers.

#### Description

- Use existing extension test harness (e.g., `pkgs/vsc-extension/src/__tests__`) to instantiate the webview provider and intercept `postMessage` calls.
- Implement helpers that capture outgoing messages, asserting `type`, payload shape, and sequencing for flows like prompt execution and CRDT sync initialization.
- Cover inbound messages by faking `onDidReceiveMessage` events to ensure controllers update workspace state or trigger side effects as expected.

### Author webview messaging tests

#### Summary

Verify the webview reacts correctly to extension messages and emits outbound messages via the VS Code API shim.

#### Description

- Extend existing Vitest/React Testing Library suites in `pkgs/vsc-webview` to mount components with a mocked `useVsc` context.
- Assert that message subscriptions update state slices (CRDT documents, settings, prompt runs) and that components render the correct UI in response.
- Simulate user interactions that trigger outbound messages (e.g., running prompts, toggling settings) and confirm the `postMessage` payloads using the mock `vscode` bridge.

### Extract reusable test harness utilities

#### Summary

Provide shared helpers so subsequent steps can write typed message tests quickly.

#### Description

- Factor message spying helpers into `pkgs/vsc-extension/src/testUtils/messages.ts` (or similar) and `pkgs/vsc-webview/src/testUtils/messages.ts`.
- Include builders for common payloads (prompt runs, sync snapshots, settings) and strongly type them using current interfaces.
- Document usage examples in the artifact and update `README`/developer docs if necessary.

### Integrate suites into CI

#### Summary

Make sure the new coverage runs with standard commands and gating workflows.

#### Description

- Update relevant `package.json` scripts or `turbo.json` pipeline entries so `pnpm test` (and targeted packages) execute the new suites.
- Confirm the tests pass in local CI simulation (`pnpm turbo run test --filter=...`) and add any required environment shims (e.g., `TextEncoder`, `MessagePort`).
- Note runtime considerations (approximate durations, setup requirements) in `test-plan.md` so future contributors understand trade-offs.

## Questions

None.

## Notes

- Prefer colocating artifacts under `.agents/plans/006-messages-consolidation/artifacts/` to keep coverage decisions transparent.
