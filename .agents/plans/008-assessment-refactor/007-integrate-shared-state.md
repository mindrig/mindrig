# Integrate Shared State

## Brief

Unify state management across the new modules using streamlined React hooks and contexts, minimizing prop drilling while retaining current functionality.

## Tasks

- [x] Identify Shared State Boundaries: Determine which data should live at the assessment shell level versus inside feature modules.
- [x] Implement Shared Hooks: Create lightweight hooks (and optional thin contexts) backed by `useState` for cross-cutting state such as results cache and run status.
- [x] Update Modules to Consume Shared State: Refactor modules to use the new hooks/context accessors instead of deep prop chains.
- [x] Consolidate Data Fetching and Mutations: Centralize API interactions so each concern has a single owner.
- [x] Regression Check: Verify TypeScript, lint, and targeted flows after integration.

### Identify Shared State Boundaries

Review the extracted modules and enumerate state that must be shared (model selections, datasource inputs, run lifecycle, results). Decide placement consistent with the “simple hooks” constraint.

#### Notes

Reference the architecture decisions to keep ownership aligned.
Shared responsibilities captured: model configuration state remains in `useModelSetupsState`, datasource form/dataset data now lives in `useAssessmentDatasourceState`, result layout/collapse toggles sit inside `useAssessmentResultsViewState`, and run execution state stays at the assessment shell for IPC wiring.

### Implement Shared Hooks

Create helper hooks (and only minimal contexts when unavoidable) such as `useAssessmentModels`, `useAssessmentDatasource`, and `useAssessmentRun` that wrap `useState` and expose streamlined interfaces. House them near `Assessment.tsx` or a new `hooks` directory.

#### Notes

Emphasize simple hook-based implementations to align with the current constraint while documenting extension points for future state managers.
`useAssessmentDatasourceState` now exposes state plus CSV/variable handlers through a context provider, while `useAssessmentResultsViewState` centralizes layout, expansion, and carousel state for downstream consumers.

### Update Modules to Consume Shared State

Refactor the extracted components to use the shared hooks/contexts, removing redundant prop threading and simplifying component APIs.

#### Notes

Ensure updates remain traceable and avoid hidden coupling.
`DatasourceSelector` and `Results` now read their data via the new providers; `Assessment.tsx` composes provider values instead of forwarding large prop chains.

### Consolidate Data Fetching and Mutations

Audit service calls and move them into the shared hooks or dedicated utilities so only one module owns each interaction. Expose clean functions for components to invoke.

#### Notes

Keep error handling consistent with prior behavior.
CSV request/clear handlers moved into the datasource hook, and result-view reset helpers consolidate UI resets before run execution.

### Regression Check

Run `pnpm lint`, `pnpm test -- --watch=false` (or equivalent) and exercise key manual flows to confirm no regressions.

#### Notes

Document any follow-up issues discovered for later resolution.
`pnpm -C pkgs/vsc-webview test/unit -- src/aspects/result/__tests__/Results.test.tsx src/aspects/datasource/__tests__/DatasourceSelector.test.tsx` passes post-refactor. `pnpm lint` still surfaces legacy violations in `src/aspects/message/messageContext.tsx`; logged in Status and to revisit during cleanup.

## Questions

None.

## Notes

If temporary bridging logic remains, flag it for cleanup in the final step.

## ADRs

None.
