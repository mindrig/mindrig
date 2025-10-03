# Define Target Architecture

## Brief

Design the modular assessment architecture that replaces the monolithic component, specifying component boundaries, shared state strategy, and communication patterns aligned with the desired file structure.

## Tasks

- [ ] Draft Component Hierarchy: Create the tree and layout responsibilities for each planned component file.
- [ ] Specify State Ownership: Decide which component or shared hook owns each significant piece of state and describe propagation.
- [ ] Define Data/Action Contracts: Outline props, context values, and callback signatures between modules.
- [ ] Map Async and Error Handling: Plan how asynchronous calls, loading states, and errors flow across modules.

### Draft Component Hierarchy

Using findings from the baseline analysis, outline how `ModelSetups`, `DatasourceSelector`, `AssessmentRun`, and `Results` nest and interact. Represent the hierarchy in a diagram or structured list saved alongside this plan.

#### Notes

Include considerations for conditional rendering (e.g., when no results exist) so later extraction preserves behavior.

### Specify State Ownership

Enumerate each critical state group (model configs, datasource inputs, run status, results cache, message history) and assign ownership to a component or shared hook. Explain how local state will sync with top-level state hooks per user guidance.

#### Notes

Call out any shared selectors or derived values that may warrant custom hooks to avoid prop drilling.

### Define Data/Action Contracts

Document the props, callback signatures, and context values required for modules to communicate. Include type sketches or interface names to speed later coding.

#### Notes

Reference existing TypeScript types from `Assessment.tsx` where possible to ease migration.

### Map Async and Error Handling

Plan how API calls, loading spinners, and error states are triggered and displayed across modules. Note where retry or cancel actions live and how status changes propagate.

#### Notes

Ensure the plan respects the current UX for pending runs and result streaming, if present.

## Questions

None.

## Notes

Store architecture artifacts in the repo’s docs scratch area or link from here for quick reference during extraction.

## ADRs

None.
