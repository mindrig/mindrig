# Build Testing Strategy

## Brief

Establish comprehensive React Testing Library coverage for the refactored assessment modules, ensuring key user flows and edge cases are validated.

## Tasks

- [ ] Audit Existing Tests: Review current assessment-related tests to understand coverage gaps.
- [ ] Define Coverage Matrix: Map required test scenarios to modules and components.
- [ ] Create Shared Test Utilities: Implement reusable helpers/mocks for API calls, context providers, and sample data.
- [ ] Implement Component Tests: Add or enhance tests for each new module following the coverage matrix.
- [ ] Implement Integration Flow Tests: Write higher-level tests exercising full assessment workflows.
- [ ] Update Test Documentation: Record the testing approach and how to run the suite.

### Audit Existing Tests

Search the repository for assessment-related tests (e.g., `rg "Assessment" --tests`) and review coverage. Document findings and gaps in this step file.

#### Notes

Include locations of legacy tests that may need updates post-refactor.

### Define Coverage Matrix

Draft a table or list mapping user flows (model setup, datasource selection, run initiation, result inspection) to specific test cases and owning components.

#### Notes

Prioritize high-value scenarios and edge cases uncovered during baseline analysis.

### Create Shared Test Utilities

Implement utilities (e.g., mock providers, factory functions, network stubs) under the project’s preferred testing utilities directory to streamline component tests.

#### Notes

Ensure utilities support toggling between JSON/Markdown/Raw modes for result messages.

### Implement Component Tests

Following the matrix, add RTL tests for each module (`ModelSetups`, `DatasourceSelector`, `AssessmentRun`, `Results`, etc.), verifying props, callbacks, and UI state transitions.

#### Notes

Reuse shared utilities to keep tests focused and maintainable.

### Implement Integration Flow Tests

Write broader tests (possibly at the `Assessment` level) that simulate end-to-end actions, ensuring modules work together as expected.

#### Notes

Leverage mocked services to simulate run success/failure and result streaming where applicable.

### Update Test Documentation

Document the new testing strategy in README, contributing docs, or this plan file, including instructions for running tests and interpreting results.

#### Notes

Highlight any remaining gaps or manual test expectations.

## Questions

None.

## Notes

Coordinate with CI configuration if new test commands or scripts are introduced.

## ADRs

None.
