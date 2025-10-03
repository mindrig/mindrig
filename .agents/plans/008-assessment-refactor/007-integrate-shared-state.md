# Integrate Shared State

## Brief

Unify state management across the new modules using streamlined React hooks and contexts, minimizing prop drilling while retaining current functionality.

## Tasks

- [ ] Identify Shared State Boundaries: Determine which data should live at the assessment shell level versus inside feature modules.
- [ ] Implement Shared Hooks: Create lightweight hooks (and optional thin contexts) backed by `useState` for cross-cutting state such as results cache and run status.
- [ ] Update Modules to Consume Shared State: Refactor modules to use the new hooks/context accessors instead of deep prop chains.
- [ ] Consolidate Data Fetching and Mutations: Centralize API interactions so each concern has a single owner.
- [ ] Regression Check: Verify TypeScript, lint, and targeted flows after integration.

### Identify Shared State Boundaries

Review the extracted modules and enumerate state that must be shared (model selections, datasource inputs, run lifecycle, results). Decide placement consistent with the “simple hooks” constraint.

#### Notes

Reference the architecture decisions to keep ownership aligned.

### Implement Shared Hooks

Create helper hooks (and only minimal contexts when unavoidable) such as `useAssessmentModels`, `useAssessmentDatasource`, and `useAssessmentRun` that wrap `useState` and expose streamlined interfaces. House them near `Assessment.tsx` or a new `hooks` directory.

#### Notes

Emphasize simple hook-based implementations to align with the current constraint while documenting extension points for future state managers.

### Update Modules to Consume Shared State

Refactor the extracted components to use the shared hooks/contexts, removing redundant prop threading and simplifying component APIs.

#### Notes

Ensure updates remain traceable and avoid hidden coupling.

### Consolidate Data Fetching and Mutations

Audit service calls and move them into the shared hooks or dedicated utilities so only one module owns each interaction. Expose clean functions for components to invoke.

#### Notes

Keep error handling consistent with prior behavior.

### Regression Check

Run `pnpm lint`, `pnpm test -- --watch=false` (or equivalent) and exercise key manual flows to confirm no regressions.

#### Notes

Document any follow-up issues discovered for later resolution.

## Questions

None.

## Notes

If temporary bridging logic remains, flag it for cleanup in the final step.

## ADRs

None.
