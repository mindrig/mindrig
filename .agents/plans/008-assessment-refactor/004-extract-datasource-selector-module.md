# Extract Datasource Selector Module

## Brief

Isolate datasource configuration into `DatasourceSelector`, `DatasourceVariables`, and `DatasourceDataset`, moving logic and UI from `Assessment.tsx` while maintaining current behavior.

## Tasks

- [x] Scaffold Datasource Components: Create the selector and tab content files with exports and baseline props.
- [x] Port Variables Workflow: Move variable form state, validation, and handlers into `DatasourceVariables`.
- [x] Port Dataset Workflow: Relocate dataset configuration UI and logic into `DatasourceDataset`.
- [x] Implement Tab Coordination: Manage tab switching and shared datasource state within `DatasourceSelector`.
- [x] Reinstate in Assessment: Swap the old datasource section in `Assessment.tsx` with the new selector module and trim redundant code.
- [x] Test Datasource Interactions: Add RTL tests covering tab switching, variable edits, and dataset configuration updates.

### Scaffold Datasource Components

Add `src/aspects/datasource/Selector.tsx`, `Variables.tsx`, and `Dataset.tsx`, ensuring proper TypeScript typings and default exports. Update any barrel files if necessary.

#### Notes

Added `src/aspects/datasource/Selector.tsx`, `Variables.tsx`, and `Dataset.tsx` with typed props matching the architecture plan.

### Port Variables Workflow

Extract the variable form JSX and backing logic from `Assessment.tsx`, embedding it in `DatasourceVariables`. Preserve validation rules, input bindings, and default values.

#### Notes

`DatasourceVariables` now owns the manual form markup and invokes upstream change handlers per field.

### Port Dataset Workflow

Move dataset-specific controls, preview panes, and handlers into `DatasourceDataset`, keeping behavior consistent and minimizing prop drilling.

#### Notes

`DatasourceDataset` encapsulates CSV controls, scope radios, and range inputs, reusing previous styles and messages.

### Implement Tab Coordination

Within `DatasourceSelector`, wire the tab controls to swap between `DatasourceVariables` and `DatasourceDataset`, managing shared datasource state and ensuring updates propagate upward.

#### Notes

`DatasourceSelector` now orchestrates the manual/dataset toggle and delegates to the new components while forwarding callbacks.

### Reinstate in Assessment

Replace the legacy datasource block in `Assessment.tsx` with the new `DatasourceSelector`. Remove obsolete code and update imports, verifying TypeScript passes.

#### Notes

`Assessment.tsx` uses `DatasourceSelector` in place of the inlined block, wiring existing state and cleanup handlers.

### Test Datasource Interactions

Author RTL tests that cover tab switching, editing variables, and adjusting dataset options, ensuring state changes emit expected callbacks.

#### Notes

Added `DatasourceSelector.test.tsx` covering variable input change, dataset workflows (row and range), helper messaging, and source toggling via RTL/Vitest.

## Questions

None.

## Notes

Track any temporary bridging logic that should be consolidated during shared-state integration.

## ADRs

None.
