# Build Testing Strategy

## Brief

Establish comprehensive React Testing Library coverage for the refactored assessment modules, ensuring key user flows and edge cases are validated.

## Tasks

- [x] Audit Existing Tests: Review current assessment-related tests to understand coverage gaps.
- [x] Define Coverage Matrix: Map required test scenarios to modules and components.
- [x] Create Shared Test Utilities: Implement reusable helpers/mocks for API calls, context providers, and sample data.
- [x] Implement Component Tests: Add or enhance tests for each new module following the coverage matrix.
- [x] Implement Integration Flow Tests: Write higher-level tests exercising full assessment workflows.
- [x] Update Test Documentation: Record the testing approach and how to run the suite.

### Audit Existing Tests

Search the repository for assessment-related tests (e.g., `rg "Assessment" --tests`) and review coverage. Document findings and gaps in this step file.

#### Notes

- Current unit coverage spans `ModelSetups` (`src/aspects/model/__tests__/ModelSetups.test.tsx`), `DatasourceSelector` (`src/aspects/datasource/__tests__/DatasourceSelector.test.tsx`), `AssessmentRun` (`src/aspects/assessment/__tests__/AssessmentRun.test.tsx`), and `Results` (`src/aspects/result/__tests__/Results.test.tsx`).
- Integration specs exist in `src/__tests__/streaming-assessment.test.tsx` (end-to-end streaming flow with mocked VS Code API) and `src/__tests__/prompt-pinning.test.tsx` (persistence/regression), but they predate the context refactor and lean on heavy mocking.
- No tests currently cover `Assessment.tsx` with real `AssessmentDatasourceProvider`/`AssessmentResultsProvider`, CSV range workflows, or manual variable validation after the shared-state extraction.
- Result message subcomponents (`ResultMessages`, `ResultMessage`, `ResultResponse`, etc.) still rely on incidental coverage from legacy tests; gaps remain for toggling rendered/raw views and JSON previews.

### Define Coverage Matrix

Draft a table or list mapping user flows (model setup, datasource selection, run initiation, result inspection) to specific test cases and owning components.

#### Notes

Prioritize high-value scenarios and edge cases uncovered during baseline analysis.
| Flow | Component/Level | Existing Coverage | Planned Additions |
| --- | --- | --- | --- |
| Provider/model configuration | `ModelSetups` + hook | Basic interaction happy-path | Add validation/error states, reasoning toggle behaviour, attachment upload error display |
| Datasource manual variables | `DatasourceSelector` | Lacks validation assertions | Add tests for empty variable disablement, trimming, manual reset |
| CSV dataset modes | `DatasourceSelector` + datasource hook | Row-mode actions only | Cover range mode validation, all-rows summary, CSV clear resets |
| Run initiation/stop | `AssessmentRun` | Button enablement/handlers | Add coverage for stop disabled states, streaming toggle persistence |
| Result layout control | `Results` | Layout buttons + toggles | Add tests for carousel index clamping, collapse state persistence |
| Result detail subcomponents | `ResultMessages`/`ResultResponse` etc. | None after extraction | Create tests for rendered/raw toggles, JSON previews, Markdown fallback |
| Assessment-level workflow | `Assessment` integration | `streaming-assessment` (legacy) | New contexts-backed integration verifying run success, error toast, persistence hydrate |
| Persistence/hydration | `Assessment` persistence utilities | Legacy partial in prompt-pinning | Add targeted test for restoring datasource/results state and saving after updates |

### Create Shared Test Utilities

Implement utilities (e.g., mock providers, factory functions, network stubs) under the project’s preferred testing utilities directory to streamline component tests.

#### Notes

Ensure utilities support toggling between JSON/Markdown/Raw modes for result messages.
Added `src/testUtils/assessment.tsx` with helpers (`createDatasourceContextValue`, `createResultsContextValue`, `createRunResult`, and `renderWithAssessmentProviders`) to standardize context wiring in RTL tests.

### Implement Component Tests

Following the matrix, add RTL tests for each module (`ModelSetups`, `DatasourceSelector`, `AssessmentRun`, `Results`, etc.), verifying props, callbacks, and UI state transitions.

#### Notes

Reuse shared utilities to keep tests focused and maintainable.
New RTL coverage: added `ResultMessage.test.tsx`, `ResultMessages.test.tsx`, `ResultResponse.test.tsx`, and expanded `Results.test.tsx`/`DatasourceSelector.test.tsx` to exercise toggles, JSON rendering, CSV "all rows" summary, and carousel clamping using the shared helpers.

### Implement Integration Flow Tests

Write broader tests (possibly at the `Assessment` level) that simulate end-to-end actions, ensuring modules work together as expected.

#### Notes

Leverage mocked services to simulate run success/failure and result streaming where applicable.
Added `AssessmentSharedState.test.tsx` exercising hydration via `loadPromptState`, verifying results/context wiring, and asserting layout persistence through the shared hooks.

### Update Test Documentation

Document the new testing strategy in README, contributing docs, or this plan file, including instructions for running tests and interpreting results.

#### Notes

Highlight any remaining gaps or manual test expectations.
Documented in this plan: run `pnpm -C pkgs/vsc-webview test/unit -- src/aspects/result __tests__ src/aspects/datasource __tests__ src/aspects/assessment/__tests__/AssessmentSharedState.test.tsx` for the new component/integration suites; note shared helpers live in `src/testUtils/assessment.tsx`.

## Questions

None.

## Notes

Coordinate with CI configuration if new test commands or scripts are introduced.

## ADRs

None.
