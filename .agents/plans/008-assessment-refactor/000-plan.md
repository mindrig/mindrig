# Assessment Refactor

## Brief

Refactor the monolithic `Assessment.tsx` component into a modular assessment experience composed of reusable model, datasource, run, and result submodules while preserving existing behavior and preparing the codebase for future reuse.

## Steps

- [x] [Baseline Assessment Component](.agents/plans/008-assessment-refactor/001-baseline-assessment-component.md): Inventory current responsibilities, state, and data flows inside `Assessment.tsx` to understand required behavior and dependencies.
- [x] [Define Target Architecture](.agents/plans/008-assessment-refactor/002-define-target-architecture.md): Establish component boundaries, shared state strategy, and communication contracts for the new module structure.
- [x] [Extract Model Setup Module](.agents/plans/008-assessment-refactor/003-extract-model-setup-module.md): Implement `ModelSetups`, `ModelSetup`, `ModelSelector`, and `ModelSettings` components and migrate related logic.
- [x] [Extract Datasource Selector Module](.agents/plans/008-assessment-refactor/004-extract-datasource-selector-module.md): Implement `DatasourceSelector`, `DatasourceVariables`, and `DatasourceDataset`, moving datasource configuration logic accordingly.
- [x] [Implement Assessment Run Panel](.agents/plans/008-assessment-refactor/005-implement-assessment-run-panel.md): Build the `AssessmentRun` component to manage run configuration, execution triggers, and status display.
- [ ] [Implement Results Module](.agents/plans/008-assessment-refactor/006-implement-results-module.md): Create `Results`, `Result`, `ResultSettings`, `ResultRequest`, `ResultMessages`, `ResultMessage`, and `ResultResponse` components and migrate rendering logic.
- [ ] [Integrate Shared State](.agents/plans/008-assessment-refactor/007-integrate-shared-state.md): Consolidate data management, context providers, and service APIs to minimize prop drilling across the new structure.
- [ ] [Build Testing Strategy](.agents/plans/008-assessment-refactor/008-build-testing-strategy.md): Design and implement React Testing Library coverage for new components and critical interactions.
- [ ] [Cleanup and Docs](.agents/plans/008-assessment-refactor/009-cleanup-and-docs.md): Remove dead code, update imports, document the new structure, and validate regressions.

### [Baseline Assessment Component](.agents/plans/008-assessment-refactor/001-baseline-assessment-component.md)

Capture a feature-by-feature map of `Assessment.tsx`, including state hooks, effects, service calls, conditional rendering, and child components to inform extraction. Document dependencies on shared utilities, contexts, and data stores.

#### Status

DONE – catalogued component structure, state/effect map, dependency inventory, and UI responsibilities for `Assessment.tsx`.

### [Define Target Architecture](.agents/plans/008-assessment-refactor/002-define-target-architecture.md)

Design the module layout, shared contexts, and data flow contracts between new components. Specify props, events, and state ownership rules, and plan for pending asynchronous interactions and error handling.

#### Status

DONE – documented component hierarchy, state ownership plan, cross-module contracts, and async/error flow alignment.

### [Extract Model Setup Module](.agents/plans/008-assessment-refactor/003-extract-model-setup-module.md)

Split model-related logic into the new components, centralizing provider/model selection, configuration state, and validation while ensuring `ModelSetups` renders the correct list of configurations.

#### Status

DONE – extracted model UI into dedicated components, centralised state via `useModelSetupsState`, rewired `Assessment.tsx`, and added RTL coverage.

### [Extract Datasource Selector Module](.agents/plans/008-assessment-refactor/004-extract-datasource-selector-module.md)

Move datasource logic into `DatasourceSelector` tabs and their subcomponents, handling variable forms, dataset configuration, and synchronization with higher-level state.

#### Status

DONE – extracted datasource UI into dedicated components, rewired `Assessment.tsx`, and added RTL coverage for variables, dataset workflows, and source toggling.

### [Implement Assessment Run Panel](.agents/plans/008-assessment-refactor/005-implement-assessment-run-panel.md)

Create the `AssessmentRun` component to encapsulate run preparation, execution triggers, progress reporting, and control availability, interfacing cleanly with shared state and services.

#### Status

DONE – introduced `AssessmentRun`, migrated control logic from `Assessment.tsx`, and added focused RTL tests.

### [Implement Results Module](.agents/plans/008-assessment-refactor/006-implement-results-module.md)

Build out the results presentation stack, ensuring reusable result item composition, message rendering modes, and alignment with existing UI/UX expectations.

#### Status

TODO

### [Integrate Shared State](.agents/plans/008-assessment-refactor/007-integrate-shared-state.md)

Refactor state management to minimize prop chains, introduce contexts or hooks as needed, and reconcile data fetching, caching, and updates across modules while maintaining behavior.

#### Status

TODO

### [Build Testing Strategy](.agents/plans/008-assessment-refactor/008-build-testing-strategy.md)

Outline and implement component-level and integration tests using React Testing Library, covering user interactions, state transitions, and rendering variations across the new modules.

#### Status

TODO

### [Cleanup and Docs](.agents/plans/008-assessment-refactor/009-cleanup-and-docs.md)

Eliminate unused code, adjust imports and exports, update documentation or ADRs, and perform regression validation including linting, type checks, and key manual flows.

#### Status

TODO

## Questions

### State Management Expectations

Should the refactor introduce any particular state management pattern (e.g., React context modules, Zustand, Redux), or should we confine updates to existing state utilities in `Assessment.tsx`?

#### Answer

Stick with React state hooks for now, streamlining existing logic so that a more advanced state manager can be layered in later if needed.

### Styling and Component Library Alignment

Are there existing design-system components or styling constraints that the new subcomponents must adopt beyond what `Assessment.tsx` currently uses?

#### Answer

Keep the current look-and-feel and behavior; defer styling changes until a later pass.

## Notes

Preserve existing behavior and API contracts while improving modularity; plan to stage extraction to keep the application runnable throughout the refactor. Favor colocating tests alongside new components unless the repository has a central tests directory.

## Prompt

I want you to plan assessment component refactoring.

The component: `pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx`

The problem is that it is huge. It's almost 3K LoC and it contains most of the application logic. I need you to split it down to the following logical parts:

- ModelSetups (`src/aspects/model/Setups.tsx`): List of all model configurations. It should render a list of ModelConfugration components.
- ModelSetup (`src/aspects/model/Setup.tsx`) - Handles model data preparing and renders ModelSelector with ModelSettings.
    - ModelSelector (`src/aspects/model/Selector.tsx`) - Two selects for provider and model ids.
    - ModelSettings (`src/aspects/model/Settings.tsx`) - Settings panel with all controls.
- DatasourceSelector (`src/aspects/datasource/Selector.tsx`) - Tabs that switch between two components: 
    - DatasourceVariables (`src/aspects/datasource/Variables.tsx`) - Renders variables form.
    - DatasourceDataset (`src/aspects/datasource/Dataset.tsx`) - Renders dataset configuration.
- AssessmentRun (`src/aspects/assessment/Run.tsx`) - Panel that allows to configure and start the run and shows its state.
- Results (`src/aspects/result/Results.tsx`) - Component that renders individual Result components and controls the layout.
- Result (`src/aspects/result/Result.tsx`) - Result component that renders the layout and other subcomponents:
    - ResultSettings (`src/aspects/result/ResultSettings.tsx`) - The settings that produced the result (currently simply JSON preview).
    - ResultRequest (`src/aspects/result/ResultRequest.tsx`) - The LLM API request (currently simply JSON preview).
    - ResultMessages (`src/aspect/result/Messages.tsx`) - The user and response messages.
    - ResultMessage (`src/aspect/result/Message.tsx`) - The component used to display a message. Use it both for user and response messages, so both have unified view (add label as a prop) and functionality (JSON/Markdown/Raw rendering).
    - ResultResponse (`src/aspects/result/ResultResponse.tsx`) - The LLM API response (currently simply JSON preview).

Data & message management must be on corresponding layers with minimizing (as much as possible, but not fanatically) number of props passed down the tree. Ideally with this structure, we can reuse the most of the components in other contexts, i.e. in the future we might (but do not try to incorporate that yet) have a test chat or global model settings disconnected from the assessments UI.

Try to cover as much as possible with unit tests via React Testing Library.

## Follow-Ups

None.
