# Baseline Assessment Component

## Brief

Understand the full behavior of `pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx`, cataloging state, side effects, data dependencies, and rendered subtrees to guide modular extraction.

## Tasks

- [x] Capture Top-Level Structure: Outline sections, helper hooks, and major rendering branches within `Assessment.tsx`.
- [x] Map State and Effects: Document all stateful constructs, derived data, and asynchronous effects with their triggers.
- [x] Inventory External Dependencies: List imported modules, shared services, contexts, and utilities that the component consumes.
- [x] Summarize UI Responsibilities: Record the user-facing features and interactions the current component supports.

### Capture Top-Level Structure

Open `pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx` and sketch the current layout: identify major React components or inline render blocks, helper functions, and conditional branches. Save the outline in step notes or a scratch document referenced from this plan.

#### Notes

Include line references for especially complex sections to speed up future navigation.

- File preamble defines local types (`ModelConfigState`, `ModelConfigErrors`, `RunResult`, `ExecutionState`) and helper utilities (`createModelConfigKey`, `providerLabel`) before the component export (`Assessment.tsx:60-162`).
- The main `Assessment` component (`Assessment.tsx:163-2840`) starts with state declarations grouped by concern: model configuration (`modelConfigs`, `expandedModelKey`, `modelErrors`), datasource (`variables`, CSV data), execution/streaming (`executionState`, `streamingState`, timers), and UI toggles (`resultsLayout`, expansion maps).
- Derived data hooks and selectors (`useMemo`/`useCallback`) establish model availability, provider lists, capability checks, dataset helpers, and prompt metadata (`Assessment.tsx:360-720`, `1180-1460`).
- Persistence helpers (`persistedStateRef`, `loadPromptState`, `savePromptState`) and hydration routines live around `Assessment.tsx:1240-1360`, ensuring session state restoration and autosave.
- Message bus handlers (`handleRun*`, attachment/dataset load callbacks) plus `useOn` subscriptions cover streaming lifecycle, dataset ingestion, attachment selection, and command palette integration (`Assessment.tsx:409-840`, `1033-1136`, `1663-1690`).
- Rendering utilities are nested inside the component: `renderResultCard` composes result sections (`Assessment.tsx:1707-1990`), with inline helper blocks for request/response toggles and content rendering.
- Final JSX arranges major panels—Model configurations, prompt variables/dataset controls, attachments management, run configuration (streaming toggles, execute/stop buttons), results layout, and error display—within a vertically stacked flex container (`Assessment.tsx:2005-2834`).

### Map State and Effects

Catalog every `useState`, `useReducer`, `useMemo`, `useCallback`, `useEffect`, and custom hook invocation. Record what each piece of state represents, how it is updated, and which UI regions consume it. Note dependencies between state pieces and side effects.

#### Notes

- Model configuration state: `modelConfigs`, `expandedModelKey`, `modelErrors`, `collapsedModelSettings`, plus helper refs for attachment targeting (`Assessment.tsx:170-218`).
- Datasource state: `variables`, CSV metadata (`csvPath`, `csvHeader`, `csvRows`, `selectedRowIdx`), source switches (`inputSource`, `datasetMode`, `rangeStart`, `rangeEnd`), with derived helpers `usingCsv`, `headersToUse`, `computeVariablesFromRowCb` (`Assessment.tsx:177-205`, `1416-1454`).
- Execution and streaming: `executionState`, `streamingState`, `streamingEnabled`, `isStopping`, `activeRunIdRef`, `streamingToggleId`, plus run lifecycle callbacks (`Assessment.tsx:183-219`, `409-783`).
- Results presentation: `resultsLayout`, `activeResultIndex`, `collapsedResults`, `viewTab`, `expandedRequest`, `expandedResponse` manage layout and expansion per result (`Assessment.tsx:202-217`, `1692-1990`).
- Hydration/persistence: `persistedStateRef`, `isHydrated`, effects syncing prompt snapshots (`Assessment.tsx:338-352`, `1248-1360`).
- Notable `useEffect`s: initial streaming settings request (`Assessment.tsx:397-400`), collapsed results reset on layout change (`401-403`), prompt-state hydration (`1264-1338`), autosave snapshot (`1343-1387`), auto-inject initial model when hydrated (`1394-1407`), sync provider labels with loaded models (`1409-1419`), clamp active result index (`1690-1698`).
- `useOn` listeners handle run lifecycle, dataset/attachment events, streaming toggles, and command execution (`Assessment.tsx:783-1160`, `1666-1679`).
- Derived data via `useMemo` groups align with future modules: provider/model lists for Model Setup, CSV helpers for Datasource Selector, run capability checks for AssessmentRun, result metadata for Results module.

### Inventory External Dependencies

List all imports that the component relies on, grouping them by responsibility (services, contexts, UI components, utilities, constants). Flag any dependencies that may need to move or be wrapped when the component is split.

#### Notes

- Messaging: `useMessage`, `useOn`, and VSC message payload types (`VscMessagePromptRun`, `VscMessageDataset`, `VscMessageAttachments`) tie into host messaging.
- Models context: `useModels`, `AvailableModel`, `ProviderModelWithScore`, model sorting utilities (`compareProviderModelEntries`, `computeRecommendationWeightsForProvider`, etc.) supply catalog data and recommendation heuristics.
- Dataset utilities: `buildRunsAndSettings`, `computeVariablesFromRow`, `parseCsvString`, `substituteVariables`, `extractPromptText` manage dataset interpolation and run preparation.
- Design system/UI: `Button`, `Select`, `ModelStatusDot`, `StreamingMarkdown`, `JsonView` deliver UI elements reused across future modules.
- Model service helpers: capability filters, attachment filtering, provider logos (`filterAttachmentsForCapabilities`, `mergeProviderOptionsWithReasoning`, `providerLogoUrl`) inform ModelSetup responsibilities.
- Persistence and streaming: `loadPromptState`, `savePromptState`, `appendTextChunk`, `createEmptyStreamingState`, `AssessmentStreamingState` align with shared state layer and results streaming module.
- Hook usage relies solely on React core imports; no external state managers currently present.

### Summarize UI Responsibilities

Document each interaction the UI currently provides (model configuration, datasource selection, running assessments, viewing results, error states). Capture how these flows are initiated and what state they depend on.

#### Notes

- Multi-model management: add/remove configurations, provider/model selects, capability badges, advanced settings accordions, attachment pickers, reasoning toggles (`Assessment.tsx:2005-2360`).
- Datasource workflows: manual variable entry forms, CSV upload via VS Code message integration, row/range/all selectors, variable interpolation previews (`Assessment.tsx:2361-2588`).
- Run panel: streaming enablement toggle, execute/stop controls with disabled states, run summary (counts, timestamps), prompt text interpolation preview, command palette trigger via message bus (`Assessment.tsx:2589-2735`).
- Results presentation: layout switching (vertical/horizontal/carousel), collapsible cards, rendered/raw view toggle, per-result settings/request/response panels, pricing info, warnings/errors badges (`Assessment.tsx:1707-2834`).
- Error handling: aggregate run error section, inline validation messaging for models, dataset, and JSON inputs; loading indicators for models and streaming states.
- Persistence UX: state hydration on load, auto-save of form inputs, CSV state, and results enabling session continuity.

## Questions

None.

## Notes

Store collected findings either within this file or link to a dedicated research note so later steps can reference the baseline quickly.

## ADRs

None.
