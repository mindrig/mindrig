# Ensure State Persistence Coverage

## Brief

Plan comprehensive local storage saving and hydration so all prompt playground inputs, selections, and derived state survive navigation and reloads without data loss.

## Tasks

- [ ] Enumerate state to persist: Translate findings from the audit into a definitive list of fields requiring serialization.
- [ ] Choose storage schema and keys: Define structured storage keys and data shapes, balancing readability with forward compatibility.
- [ ] Specify save triggers: Determine which events or hooks (e.g., state updates, debounced effects) should write to local storage.
- [ ] Outline hydration flow: Describe how and when stored data hydrates into the app state without causing flicker or stale overwrites.
- [ ] Plan error handling and versioning: Decide how to guard against corrupted storage and manage future schema evolutions.

### Enumerate state to persist

List each state slice (data source selection, manual variables, CSV row selection, etc.) and map it to its owning store or component.

#### Notes

Reference the summary from Step 1 to avoid omissions.

### Choose storage schema and keys

Define JSON structure and keys for local storage entries, considering splitting data into multiple keys versus a single blob.

#### Notes

Account for ease of clearing/inspection during debugging.

### Specify save triggers

Identify the exact hooks/effects that will observe state changes and persist them, including debouncing strategy and performance considerations.

#### Notes

Document any rate-limiting or batching requirements.

### Outline hydration flow

Describe the initialization sequence where stored state is parsed, validated, and merged with defaults, ensuring compatibility with server-provided data if any.

#### Notes

Clarify how to handle missing or partial data gracefully.

### Plan error handling and versioning

Propose a version field and fallback strategy for corrupted or legacy data, as well as manual reset mechanisms if needed later.

#### Notes

Capture logging or telemetry hooks if we want to monitor persistence issues.

## Questions

None.

## Notes

Remember the storage retention decision: keep data indefinitely unless manually cleared.

## ADRs

None.
