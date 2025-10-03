# Extract Datasource Selector Module

## Brief

Isolate datasource configuration into `DatasourceSelector`, `DatasourceVariables`, and `DatasourceDataset`, moving logic and UI from `Assessment.tsx` while maintaining current behavior.

## Tasks

- [ ] Scaffold Datasource Components: Create the selector and tab content files with exports and baseline props.
- [ ] Port Variables Workflow: Move variable form state, validation, and handlers into `DatasourceVariables`.
- [ ] Port Dataset Workflow: Relocate dataset configuration UI and logic into `DatasourceDataset`.
- [ ] Implement Tab Coordination: Manage tab switching and shared datasource state within `DatasourceSelector`.
- [ ] Reinstate in Assessment: Swap the old datasource section in `Assessment.tsx` with the new selector module and trim redundant code.
- [ ] Test Datasource Interactions: Add RTL tests covering tab switching, variable edits, and dataset configuration updates.

### Scaffold Datasource Components

Add `src/aspects/datasource/Selector.tsx`, `Variables.tsx`, and `Dataset.tsx`, ensuring proper TypeScript typings and default exports. Update any barrel files if necessary.

#### Notes

Create placeholder props for shared callbacks and data structures to refine during migration.

### Port Variables Workflow

Extract the variable form JSX and backing logic from `Assessment.tsx`, embedding it in `DatasourceVariables`. Preserve validation rules, input bindings, and default values.

#### Notes

Document any implicit assumptions (e.g., required fields) to revisit during testing.

### Port Dataset Workflow

Move dataset-specific controls, preview panes, and handlers into `DatasourceDataset`, keeping behavior consistent and minimizing prop drilling.

#### Notes

If dataset logic depends on shared services, import them directly or expose via context according to the architecture plan.

### Implement Tab Coordination

Within `DatasourceSelector`, wire the tab controls to swap between `DatasourceVariables` and `DatasourceDataset`, managing shared datasource state and ensuring updates propagate upward.

#### Notes

Respect any loading or validation gating present in the original UI when switching tabs.

### Reinstate in Assessment

Replace the legacy datasource block in `Assessment.tsx` with the new `DatasourceSelector`. Remove obsolete code and update imports, verifying TypeScript passes.

#### Notes

Coordinate with model module integration to ensure shared state remains coherent.

### Test Datasource Interactions

Author RTL tests that cover tab switching, editing variables, and adjusting dataset options, ensuring state changes emit expected callbacks.

#### Notes

Mock external data loading to keep tests deterministic.

## Questions

None.

## Notes

Track any temporary bridging logic that should be consolidated during shared-state integration.

## ADRs

None.
