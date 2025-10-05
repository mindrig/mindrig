# Add Navigation and Persistence Tests

## Brief

Define React Testing Library coverage that validates hash navigation behavior and confirms prompt state persists through route switches and reloads.

## Tasks

- [x] Identify test surfaces: Determine which components or hooks require RTL tests versus unit tests for utilities (e.g., hash parser).
- [x] Draft navigation test scenarios: Outline test cases for default route, switching to auth, using history back, fallback to index, and initial render when the host path is `/` versus `/index.html`.
- [x] Draft persistence test scenarios: Specify tests that mutate prompt state, navigate away, reload context, and assert state restoration from local storage.
- [x] Plan test utilities and mocks: Decide on helpers for faking `window.location`, `history`, and local storage within the test environment.
- [x] Define coverage for regression guards: Note any additional assertions needed to guard against known bugs (e.g., double renders, missing saves).

### Identify test surfaces

List components/modules under test and map them to corresponding test files (`*.test.tsx`), noting any new directories required.

#### Notes

- Added `hash-router-navigation.test.tsx` (React Testing Library + mocked providers) to cover default hash handling, `/index.html` aliasing, unknown path fallback, and `goBackOrIndex` history behavior.
- Updated `vercel-auth.integration.test.tsx` to exercise the new `Auth` route in isolation with navigation mocks, ensuring lifecycle messaging, message-based opening, submission, and history fallback wiring.

### Draft navigation test scenarios

Outline step-by-step test flows, including render setup, hash updates, expected DOM changes for both routes, and assertions that React Router handles both entrypaths correctly.

#### Notes

- Asserted Index render for blank hash, `#/auth` rendering, `/index.html` alias, and hard-fallback to index; close button behavior verified via navigation spy instead of window hash.

### Draft persistence test scenarios

Detail the sequence for populating state, saving to storage, simulating navigation/reload, and verifying hydration post-transition.

#### Notes

- Augmented `AssessmentSharedState` integration test to capture collapse/view/streaming fields in the persistence snapshot, and added `persistence.test.ts` to confirm schema version stamping and round-tripping of new fields.

### Plan test utilities and mocks

Specify helper functions or setup code to stub browser APIs, mock `HashRouter` context where necessary, and reset them between tests.

#### Notes

- Expanded testing helpers to stub `useAppNavigation` and history state where needed; used happy-dom-safe patterns instead of `replaceState` to avoid origin mismatches.

### Define coverage for regression guards

Identify additional assertions to catch regressions such as redundant storage writes or lost focus state.

#### Notes

- Navigation tests guard against regressions in alias handling; persistence unit test verifies versioning and new fields, while Integration tests ensure `lifecycle-webview-ready` still fires regardless of entry route.

## Questions

None.

## Notes

Coordinate with persistence plan to share fixtures or mock data structures.

## ADRs

None.
