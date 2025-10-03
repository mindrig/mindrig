# Regression Tests & Documentation

## Brief

Add or update automated tests, manual verification notes, and documentation to cover the new models data pipeline, error handling, and secret management flows.

## Tasks

- [x] Extend extension tests: Add coverage for controller fallbacks, key status messaging, and masked secrets.
- [x] Extend webview tests: Update mocks and UI tests for new context, error banners, and selector states.
- [x] Update shared package tests: Adjust `@wrkspc/vsc-message` and related type checks to reflect new message payloads.
- [x] Document manual verification: Outline QA checklist for gateway success/failure, retry, and secret updates.
- [x] Update internal docs: Refresh relevant markdown (e.g., feature docs, troubleshooting) describing new flow.

### Extend extension tests

Ensure automated coverage of backend behaviors.

- Add unit tests for `ModelsDataController` covering user-scoped success, failure fallback, and caching logic.
- Verify key status messages emit correct payloads on success/error.
- Mock secret manager scenarios (no key, invalid key, cleared key).

#### Notes

- Manual QA checklist recorded:
  - Seed extension with/without gateway key and observe masked state + read-only lock.
  - Intentionally fail the user-scoped fetch (invalid key) to verify fallback data, banner retry/update controls, and inline form error.
  - Clear key to confirm UI re-enables input and banner disappears once resolved.

### Extend webview tests

Adapt existing webview testing to new context and UI.

- Update component tests to mock context provider and assert disabled/ warning states.
- Ensure retry/update buttons trigger expected messaging calls.
- Cover inline error rendering inside the secret form.

#### Notes

- `docs/architecture/messages.md` now documents `models-data-get/response` and the masked `auth-vercel-gateway-*` payloads.

### Update shared package tests

Keep shared message/type packages aligned.

- Add/adjust tests in `@wrkspc/vsc-message` validating new message shapes.
- Update fixtures for masked secret payloads.
- Ensure TypeScript declarations compile with new exports.

#### Notes

- Added `models-data-controller.test.ts` covering user success, fallback, and key status emission (`pkgs/vsc-extension/src/__tests__/models-data-controller.test.ts`).

### Document manual verification

Create a concise checklist for QA/UX validation.

- Include steps for configuring valid/invalid keys, retrying, and observing fallbacks.
- Note expected banners, disabled states, and inline errors for each scenario.
- Capture how to simulate wrapper fallback by forcing gateway failure.

#### Notes

- Updated Vitest suites mock `useModels`; added assertions for selector disablement and banner retry controls (`streaming-assessment.test.tsx`, `prompt-pinning.test.tsx`).

### Update internal docs

Refresh knowledge base or readmes.

- Update developer docs covering models data to reflect new architecture.
- Record troubleshooting guidance for gateway failures and secret resets.
- Note security posture improvements (masked secrets, no client key exposure).

#### Notes

- `vscMessageBus.test.ts` expectations now cover masked secret payloads and new status message wiring.

## Questions

None.

## Notes

- Coordinate with documentation team if external release notes are required.

## ADRs

None.
