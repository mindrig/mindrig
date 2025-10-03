# Implement Results Module

## Brief

Build the results presentation stack (`Results`, `Result`, `ResultSettings`, `ResultRequest`, `ResultMessages`, `ResultMessage`, `ResultResponse`) and migrate related logic from `Assessment.tsx` without altering current UX.

## Tasks

- [ ] Scaffold Results Components: Create all result-related files with exports and prop interfaces.
- [ ] Extract Results Rendering Logic: Move list rendering, ordering, and layout responsibilities into `Results`.
- [ ] Implement Result Composition: Assemble `Result` to coordinate subcomponents and shared controls.
- [ ] Port Subcomponents: Fill `ResultSettings`, `ResultRequest`, `ResultMessages`, `ResultMessage`, and `ResultResponse` with migrated logic.
- [ ] Wire Data Flow: Ensure results state, message details, and metadata flow via props/context per architecture.
- [ ] Replace in Assessment: Use the new results module within `Assessment.tsx`, pruning legacy code.
- [ ] Test Result Presentation: Add RTL tests covering result list rendering, message toggles, and JSON/Markdown/Raw switching.

### Scaffold Results Components

Create files under `src/aspects/result/` for each component, defining typed props and default exports. Update any barrel or index files if required.

#### Notes

Reuse shared types for result data to prevent duplication.

### Extract Results Rendering Logic

Relocate list mapping, empty-state handling, and layout wrappers from `Assessment.tsx` into the new `Results` component.

#### Notes

Maintain pagination or virtualisation behaviors if present.

### Implement Result Composition

Construct the `Result` component to combine settings, request, messages, and response sections, controlling layout and shared controls such as expand/collapse.

#### Notes

Expose callbacks for actions (e.g., re-run, copy) so the parent can hook into them later.

### Port Subcomponents

Populate each subcomponent with the JSX and logic previously inlined, ensuring they render JSON previews or markdown views exactly as before.

#### Notes

For `ResultMessage`, include the label prop to distinguish user vs. assistant messages while reusing the same component.

### Wire Data Flow

Hook up the props or context needed to populate results, message lists, and metadata, following the state ownership plan.

#### Notes

Consider memoization or derived data hooks to keep rendering performant after extraction.

### Replace in Assessment

Swap the original results section in `Assessment.tsx` with the new `Results` component, passing required data and removing redundant code.

#### Notes

Verify TypeScript and linting succeed after refactor.

### Test Result Presentation

Author RTL tests that verify result lists render correctly, message toggles work, and JSON/Markdown/Raw rendering behaves as expected.

#### Notes

Mock complex data structures to exercise edge cases (empty messages, error responses).

## Questions

None.

## Notes

Align naming conventions with existing result data models to simplify shared-state integration.

## ADRs

None.
