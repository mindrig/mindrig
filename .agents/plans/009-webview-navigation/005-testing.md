# Add Navigation and Persistence Tests

## Brief

Define React Testing Library coverage that validates hash navigation behavior and confirms prompt state persists through route switches and reloads.

## Tasks

- [ ] Identify test surfaces: Determine which components or hooks require RTL tests versus unit tests for utilities (e.g., hash parser).
- [ ] Draft navigation test scenarios: Outline test cases for default route, switching to auth, using history back, and fallback to index.
- [ ] Draft persistence test scenarios: Specify tests that mutate prompt state, navigate away, reload context, and assert state restoration from local storage.
- [ ] Plan test utilities and mocks: Decide on helpers for faking `window.location`, `history`, and local storage within the test environment.
- [ ] Define coverage for regression guards: Note any additional assertions needed to guard against known bugs (e.g., double renders, missing saves).

### Identify test surfaces

List components/modules under test and map them to corresponding test files (`*.test.tsx`), noting any new directories required.

#### Notes

Prioritize integration-style tests using RTL where possible.

### Draft navigation test scenarios

Outline step-by-step test flows, including render setup, hash updates, and expected DOM changes for both routes.

#### Notes

Call out assertions for header presence and navigation callbacks.

### Draft persistence test scenarios

Detail the sequence for populating state, saving to storage, simulating navigation/reload, and verifying hydration post-transition.

#### Notes

Include edge cases like empty storage or corrupted JSON.

### Plan test utilities and mocks

Specify helper functions or setup code to stub browser APIs and reset them between tests.

#### Notes

Ensure compatibility with existing test setup (e.g., `vitest` or `jest` environment).

### Define coverage for regression guards

Identify additional assertions to catch regressions such as redundant storage writes or lost focus state.

#### Notes

Mention metrics or instrumentation checks if appropriate.

## Questions

None.

## Notes

Coordinate with persistence plan to share fixtures or mock data structures.

## ADRs

None.
