# Assessment Module Refactor

The assessment experience is now composed of focused modules backed by shared hooks and RTL coverage. The core pieces are:

- `Assessment` orchestrates shared state and wraps feature panels in `AssessmentDatasourceProvider` and `AssessmentResultsProvider` contexts.
- Model configuration flows live in `src/aspects/model`, driven by `useModelSetupsState`.
- Datasource handling resides in `src/aspects/datasource`, consuming the datasource context and supporting manual, row, range, and all-rows workflows.
- Run execution UI is encapsulated in `src/aspects/assessment/Run.tsx`.
- Results display is composed from `src/aspects/result`, with `ResultMessage` providing consistent rendered/raw toggles for messages, requests, and responses.

## Shared Hooks

- `useAssessmentDatasourceState` manages datasource inputs, CSV metadata, and derived helpers, exposing a context value via `AssessmentDatasourceProvider`.
- `useAssessmentResultsViewState` owns layout toggles, collapse state, and carousel index, exposed through `AssessmentResultsProvider`.
- Both hooks expose raw React state dispatchers so downstream components can batch updates or reset state without additional wrappers.

## Testing

- Component coverage (`ResultMessage[s]`, `ResultResponse`, `Results`, `DatasourceSelector`) lives alongside their modules under `__tests__`.
- `src/testUtils/assessment.tsx` supplies helper factories and a `renderWithAssessmentProviders` wrapper for context-aware tests.
- `src/aspects/assessment/__tests__/AssessmentSharedState.test.tsx` verifies persisted state hydration and layout persistence end-to-end.

Run targeted tests with:

```
pnpm -C pkgs/vsc-webview test/unit -- src/aspects/result/__tests__ src/aspects/datasource/__tests__/DatasourceSelector.test.tsx src/aspects/assessment/__tests__/AssessmentSharedState.test.tsx
```

## Follow-Ups

- Global lint currently fails due to pre-existing violations in `src/aspects/message/messageContext.tsx`; cleanup remains on the backlog.
- Additional integration tests can extend the shared-state suite to cover CSV dataset flows once the UI is wired to real services.
