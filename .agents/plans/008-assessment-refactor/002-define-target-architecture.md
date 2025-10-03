# Define Target Architecture

## Brief

Design the modular assessment architecture that replaces the monolithic component, specifying component boundaries, shared state strategy, and communication patterns aligned with the desired file structure.

## Tasks

- [x] Draft Component Hierarchy: Create the tree and layout responsibilities for each planned component file.
- [x] Specify State Ownership: Decide which component or shared hook owns each significant piece of state and describe propagation.
- [x] Define Data/Action Contracts: Outline props, context values, and callback signatures between modules.
- [x] Map Async and Error Handling: Plan how asynchronous calls, loading states, and errors flow across modules.

### Draft Component Hierarchy

Using findings from the baseline analysis, outline how `ModelSetups`, `DatasourceSelector`, `AssessmentRun`, and `Results` nest and interact. Represent the hierarchy in a diagram or structured list saved alongside this plan.

#### Notes

Include considerations for conditional rendering (e.g., when no results exist) so later extraction preserves behavior.

```
AssessmentShell (existing Assessment entry point)
├─ ModelSetups (list container)
│  └─ ModelSetup (per config)
│     ├─ ModelSelector (provider+model dropdowns)
│     └─ ModelSettings (advanced options, attachments, reasoning toggle)
├─ DatasourceSelector (tabs)
│  ├─ DatasourceVariables (manual form + interpolation preview)
│  └─ DatasourceDataset (CSV meta, row/range selectors, load/clear buttons)
├─ AssessmentRun (streaming toggle, run/stop/clear controls, run summary)
└─ Results (layout switcher, empty state)
   └─ Result (card)
      ├─ ResultSettings (JSON summary of model settings)
      ├─ ResultRequest (request JSON)
      ├─ ResultMessages (list)
      │  └─ ResultMessage (labelled chat bubble w/ view modes)
      └─ ResultResponse (response JSON/markdown)
```

- `AssessmentShell` handles persistence hydration, message subscriptions, and composes state providers/hooks before rendering the tree.
- `Results` hides itself when no results exist, but maintains layout controls in parent so state persists between runs.
- Attachments UI remains within `ModelSettings`, but upload/clear affordances surface to `ModelSetup` for clarity.
- Dataset tab should show manual variables even when CSV is loaded (current behavior) and display informative empty states when neither source has data.

### Specify State Ownership

Enumerate each critical state group (model configs, datasource inputs, run status, results cache, message history) and assign ownership to a component or shared hook. Explain how local state will sync with top-level state hooks per user guidance.

#### Notes

- Shared hooks (all `useState`-backed):
  - `useAssessmentModels()` – own `modelConfigs`, `modelErrors`, `expandedModelKey`, attachment refs, derived capability helpers; exposes CRUD operations and validation helpers.
  - `useAssessmentDatasource()` – own `variables`, CSV metadata, `inputSource`, `datasetMode`, range selectors; exposes dataset load/clear actions and variable setters.
  - `useAssessmentRun()` – own `executionState`, `streamingState`, `streamingEnabled`, `isStopping`, layout/active index maps; exposes `execute`, `stop`, `clear`, layout toggles, expansion setters.
  - `useAssessmentPersistence()` – manage hydration/autosave bridging prompt meta with the above slices.
- Provider strategy: `AssessmentShell` instantiates the hooks and threads their outputs via props; thin `createContext` wrappers remain optional for deeply nested consumers (e.g., results subcomponents) but stay `useState`-driven.
- Ownership map:
  - `ModelSetups` receives models slice + gateway loading status (`useModels`) and only mutates through hooked callbacks.
  - `DatasourceSelector` receives datasource slice plus derived `canExecute` diagnostics for AssessmentRun.
  - `AssessmentRun` consumes run slice plus read-only snapshots from models/datasource (for validation summary) without mutating their internal state.
  - `Results`/`Result` consume run slice read-only data and expose view toggle setters living in the run slice to preserve persistent layout state.
- Derived selectors such as `providerOptions`, `groupedModelsByProvider`, `headersToUse`, `preparedModels` live inside respective hooks so consumers pull precomputed data without recomputing.

### Define Data/Action Contracts

Document the props, callback signatures, and context values required for modules to communicate. Include type sketches or interface names to speed later coding.

#### Notes

- `ModelSetups` props: `{ configs, errors, expandedKey, capabilitiesMap, providerOptions, onAdd(), onRemove(key), onToggleExpand(key), onUpdateConfig(key, patch), onRequestAttachments(key), onClearAttachments(key) }`.
- `ModelSetup` props extend with `modelOptions`, `capabilities`, `attachments`, `streamingEnabled`, `disabled` flags, plus callbacks for JSON fields (`onSettingsChange`, `onReasoningToggle`).
- `ModelSelector` props minimal: `{ providerOptions, modelOptions, selectedProvider, selectedModel, onProviderChange(id), onModelChange(id), loadingStates }`.
- `ModelSettings` props: `{ generationOptions, reasoning, toolsJson, providerOptionsJson, errors, capabilities, attachments, onGenerationOptionChange(field, value), onReasoningChange(patch), onToolsJsonChange(text), onProviderOptionsChange(text), onAttachmentsAdd(), onAttachmentsClear() }`.
- `DatasourceSelector` props: `{ inputSource, onInputSourceChange(source), variables, onVariableChange(name, value), datasetMeta, onDatasetLoad(), onDatasetClear(), datasetMode, onDatasetModeChange(), range, onRangeChange(), usingCsv, validation }` with tab children receiving scoped subsets.
- `AssessmentRun` props: `{ promptMeta, preparedModels, datasetSummary, canExecute, streamingEnabled, onToggleStreaming(enabled), onExecute(), onStop(), onClear(), runStatus, executeDisabledReason }`.
- `Results` props: `{ results, layout, onLayoutChange(layout), activeIndex, onActiveIndexChange(idx), collapsedMap, onToggleCollapse(idx), viewTabs, onChangeView(idx, mode), expandedRequest, onToggleRequest(idx), expandedResponse, onToggleResponse(idx) }`.
- `Result` props package a single result plus handlers; nested `ResultSettings/Request/Messages/Response` accept simple data objects (`settings`, `request`, `messages[]`, `response`, `usage`, `modelMeta`) and toggle callbacks.
- Shared types reused: `ModelConfigState`, `RunResult`, `AssessmentStreamingState`, `GenerationOptionsInput` extracted to dedicated type modules for import across components.

### Map Async and Error Handling

Plan how API calls, loading spinners, and error states are triggered and displayed across modules. Note where retry or cancel actions live and how status changes propagate.

#### Notes

- Model/data fetch: `AssessmentShell` keeps `useModels` subscription; loading/errors passed to `ModelSetups` for inline messaging. No additional network layer introduced.
- Dataset & attachment requests remain asynchronous via message bus; hooks expose `requestDataset`, `requestAttachments` functions that dispatch messages and update local pending flags. Errors surface within `DatasourceDataset` and `ModelSettings` via existing copy.
- Run execution: `useAssessmentRun` centralises `prompt-run-*` listeners (start/update/complete/error/result-complete/execution-result). It exposes status fields consumed by `AssessmentRun` (button disabled states) and `Results` (streaming updates).
- Streaming toggle: `AssessmentRun` controls `streamingEnabled` flag stored in run slice; initial value seeded via `settings-streaming-get/state` message effects to mirror current behavior.
- Error propagation: run-level errors stay in run slice and display under `AssessmentRun` (for immediate feedback) and dedicated error block below results; validation errors for model configs/datasource remain local to respective slices.
- Persistence: hydration occurs before rendering children; hooks expose `hydrated` flag so subcomponents can show skeletons/spinners while state loads.
- Command palette execution via `prompts-execute-from-command` continues to call `onExecute` inside run slice; guard logic ensures prompts only run when `canExecute` is true.

## Questions

None.

## Notes

Store architecture artifacts in the repo’s docs scratch area or link from here for quick reference during extraction.

## ADRs

None.
