# Implement Results Module

## Brief

Build the results presentation stack (`Results`, `Result`, `ResultSettings`, `ResultRequest`, `ResultMessages`, `ResultMessage`, `ResultResponse`) and migrate related logic from `Assessment.tsx` without altering current UX.

## Tasks

- [x] Scaffold Results Components: Create all result-related files with exports and prop interfaces.
- [x] Extract Results Rendering Logic: Move list rendering, ordering, and layout responsibilities into `Results`.
- [x] Implement Result Composition: Assemble `Result` to coordinate subcomponents and shared controls.
- [x] Port Subcomponents: Fill `ResultSettings`, `ResultRequest`, `ResultMessages`, `ResultMessage`, and `ResultResponse` with migrated logic.
- [x] Wire Data Flow: Ensure results state, message details, and metadata flow via props/context per architecture.
- [x] Replace in Assessment: Use the new results module within `Assessment.tsx`, pruning legacy code.
- [x] Test Result Presentation: Add RTL tests covering result list rendering, message toggles, and JSON/Markdown/Raw switching.

### Scaffold Results Components

Create files under `src/aspects/result/` for each component, defining typed props and default exports. Update any barrel or index files if required.

#### Notes

Added `src/aspects/result/` components and exported them via `index.ts`; shared `RunResult` type now lives in `src/aspects/assessment/types.ts`.

### Extract Results Rendering Logic

Relocate list mapping, empty-state handling, and layout wrappers from `Assessment.tsx` into the new `Results` component.

#### Notes

`Results.tsx` owns layout switching (vertical/horizontal/carousel) and result mapping logic previously embedded in `Assessment.tsx`.

### Implement Result Composition

Construct the `Result` component to combine settings, request, messages, and response sections, controlling layout and shared controls such as expand/collapse.

#### Notes

`Result.tsx` orchestrates subcomponents and surfaces collapse/toggle callbacks provided by the parent.

### Port Subcomponents

Populate each subcomponent with the JSX and logic previously inlined, ensuring they render JSON previews or markdown views exactly as before.

#### Notes

Dedicated subcomponents (`ResultSettings`, `ResultRequest`, `ResultMessages`, `ResultMessage`, `ResultResponse`, `PricingInfo`) encapsulate the prior inline sections and maintain existing UX.

### Wire Data Flow

Hook up the props or context needed to populate results, message lists, and metadata, following the state ownership plan.

#### Notes

Data flow now passes through structured props from `Assessment.tsx`, keeping state centralized while avoiding prop drilling beyond the new module boundary.

### Replace in Assessment

Swap the original results section in `Assessment.tsx` with the new `Results` component, passing required data and removing redundant code.

#### Notes

`Assessment.tsx` now consumes `<Results>` with state callbacks, eliminating the monolithic `renderResultCard` helper and legacy pricing helper.

### Test Result Presentation

Author RTL tests that verify result lists render correctly, message toggles work, and JSON/Markdown/Raw rendering behaves as expected.

#### Notes

Added `Results.test.tsx` covering layout changes, view toggles, collapse callbacks, and carousel navigation.

## Questions

None.

## Notes

Align naming conventions with existing result data models to simplify shared-state integration.

## ADRs

None.
