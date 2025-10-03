# Implement Assessment Run Panel

## Brief

Create the `AssessmentRun` component to encapsulate configuring and launching assessment runs, migrating state, handlers, and status UI from `Assessment.tsx`.

## Tasks

- [ ] Scaffold AssessmentRun Component: Add `src/aspects/assessment/Run.tsx` with baseline props and exports.
- [ ] Transfer Run Configuration Logic: Move scheduling, validation, and parameter binding into the new component.
- [ ] Handle Execution Lifecycle: Implement run start, cancellation, and status updates using existing services.
- [ ] Preserve Status UI: Port progress indicators, disabled states, and action controls into the component.
- [ ] Integrate Back into Assessment: Replace the run panel section in `Assessment.tsx` with `AssessmentRun` usage.
- [ ] Test Run Workflows: Write RTL tests covering run configuration and lifecycle transitions.

### Scaffold AssessmentRun Component

Create the file with a typed props interface capturing required inputs (model config references, datasource selections, callbacks for run events). Export the component and update any relevant index files.

#### Notes

Keep props focused on data and callbacks; defer broader state sharing decisions to the integration step.

### Transfer Run Configuration Logic

Move all code handling run parameter inputs (prompts, thresholds, evaluation options) into `AssessmentRun`, ensuring local state mirrors prior behavior.

#### Notes

Document any assumptions about default values or required fields for later validation.

### Handle Execution Lifecycle

Port the functions that initiate runs, track progress, and react to completion or failure. Ensure the component emits events upward as planned in the architecture.

#### Notes

Consider encapsulating repeated service calls into helper hooks if it improves clarity without breaking the "simple hooks" constraint.

### Preserve Status UI

Copy the visual elements showing run state (buttons, spinners, result counters) and ensure they respond to state updates identically to the original component.

#### Notes

Maintain existing accessibility attributes and button labels to avoid regressions.

### Integrate Back into Assessment

Replace the original run-related JSX in `Assessment.tsx` with the new `AssessmentRun` component, connecting props and removing redundant logic.

#### Notes

Confirm TypeScript types remain valid and update tests or stories referencing the old structure.

### Test Run Workflows

Develop RTL tests that simulate configuring a run, starting it, handling success/failure, and verifying status UI updates.

#### Notes

Mock network/service layers to control outcomes and assert emitted callbacks.

## Questions

None.

## Notes

Coordinate with shared-state integration to ensure run status updates propagate to results and other modules correctly.

## ADRs

None.
