# Implement Assessment Run Panel

## Brief

Create the `AssessmentRun` component to encapsulate configuring and launching assessment runs, migrating state, handlers, and status UI from `Assessment.tsx`.

## Tasks

- [x] Scaffold AssessmentRun Component: Add `src/aspects/assessment/Run.tsx` with baseline props and exports.
- [x] Transfer Run Configuration Logic: Move scheduling, validation, and parameter binding into the new component.
- [x] Handle Execution Lifecycle: Implement run start, cancellation, and status updates using existing services.
- [x] Preserve Status UI: Port progress indicators, disabled states, and action controls into the component.
- [x] Integrate Back into Assessment: Replace the run panel section in `Assessment.tsx` with `AssessmentRun` usage.
- [x] Test Run Workflows: Write RTL tests covering run configuration and lifecycle transitions.

### Scaffold AssessmentRun Component

Create the file with a typed props interface capturing required inputs (model config references, datasource selections, callbacks for run events). Export the component and update any relevant index files.

#### Notes

Created `AssessmentRun` with a focused props interface covering run controls and streaming toggle interactions.

### Transfer Run Configuration Logic

Move all code handling run parameter inputs (prompts, thresholds, evaluation options) into `AssessmentRun`, ensuring local state mirrors prior behavior.

#### Notes

Run/stop/clear/streaming handlers are surfaced via props while execution validation remains in `Assessment.tsx` until shared-state work.

### Handle Execution Lifecycle

Port the functions that initiate runs, track progress, and react to completion or failure. Ensure the component emits events upward as planned in the architecture.

#### Notes

Streaming toggle now delegates to a parent callback that persists the existing message dispatch semantics.

### Preserve Status UI

Copy the visual elements showing run state (buttons, spinners, result counters) and ensure they respond to state updates identically to the original component.

#### Notes

Preserved prior button labels, disabled states, and layout in the new component.

### Integrate Back into Assessment

Replace the original run-related JSX in `Assessment.tsx` with the new `AssessmentRun` component, connecting props and removing redundant logic.

#### Notes

`Assessment.tsx` renders `AssessmentRun`, passing derived flags (run state, results presence) and existing event handlers.

### Test Run Workflows

Develop RTL tests that simulate configuring a run, starting it, handling success/failure, and verifying status UI updates.

#### Notes

Added `AssessmentRun.test.tsx` to verify control visibility, disabled states, and callback wiring.

## Questions

None.

## Notes

Coordinate with shared-state integration to ensure run status updates propagate to results and other modules correctly.

## ADRs

None.
