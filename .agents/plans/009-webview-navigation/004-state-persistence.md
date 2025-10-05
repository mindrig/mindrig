# Ensure State Persistence Coverage

## Brief

Plan comprehensive local storage saving and hydration so all prompt playground inputs, selections, and derived state survive navigation and reloads without data loss.

## Tasks

- [x] Enumerate state to persist: Translate findings from the audit into a definitive list of fields requiring serialization.
- [x] Choose storage schema and keys: Define structured storage keys and data shapes, balancing readability with forward compatibility.
- [x] Specify save triggers: Determine which events or hooks (e.g., state updates, debounced effects) should write to local storage.
- [x] Outline hydration flow: Describe how and when stored data hydrates into the app state without causing flicker or stale overwrites.
- [x] Plan error handling and versioning: Decide how to guard against corrupted storage and manage future schema evolutions.

### Enumerate state to persist

List each state slice (data source selection, manual variables, CSV row selection, etc.) and map it to its owning store or component.

#### Notes

- Persisted snapshot now captures model configs (with reasoning/tools/options), prompt variables, datasource CSV path/header/rows/selection, prompt execution results, layout, active result index, streaming toggle, and per-result UI affordances (collapsed states, expanded request/response, view tabs).
- Index-specific state (pinned prompts) continues to use VS Code webview storage; all playground-related state flows through the `PlaygroundState` blob.

### Choose storage schema and keys

Define JSON structure and keys for local storage entries, considering splitting data into multiple keys versus a single blob.

#### Notes

- Extended `PlaygroundState` in `persistence.ts` with `collapsed*`, `viewTabs`, `streamingEnabled`, and `schemaVersion`; continued to use the existing `mindrig.playground.prompts` key so stored data remains discoverable.
- Added `PLAYGROUND_STATE_VERSION` constant and embed `schemaVersion` when writing, leaving room for schema upgrades while maintaining backward compatibility with legacy entries.

### Specify save triggers

Identify the exact hooks/effects that will observe state changes and persist them, including debouncing strategy and performance considerations.

#### Notes

- The save effect in `Assessment.tsx` now tracks changes to collapse/expansion/view-tab maps and the streaming toggle, emitting a shallow-cloned snapshot whenever those dependencies mutate; no extra debouncing needed because updates batch at React state granularity.
- Continued to rely on `Assessment`-level state updates (triggered on every relevant user action) to flush persistence so route switches immediately serialize the current snapshot.

### Outline hydration flow

Describe the initialization sequence where stored state is parsed, validated, and merged with defaults, ensuring compatibility with server-provided data if any.

#### Notes

- Hydration converts stored numeric-keyed maps back into `Record<number, …>` via helper functions and defaults new fields when absent; streaming toggles fall back to `true` to match previous behaviour.
- Added branch to reset derived UI state when no stored snapshot exists, preventing stale UI remnants after clearing persistence.

### Plan error handling and versioning

Propose a version field and fallback strategy for corrupted or legacy data, as well as manual reset mechanisms if needed later.

#### Notes

- `savePromptState` now stamps a schema version; `loadPromptState` callers treat missing or unsupported fields as defaults, so corrupted entries still fall back via existing try/catch guards without crashing the UI.
- Versioned entries enable lightweight migrations later without breaking existing stores; failures continue to be logged through existing console errors in `persistence.ts`.

## Questions

None.

## Notes

Remember the storage retention decision: keep data indefinitely unless manually cleared.

## ADRs

None.
