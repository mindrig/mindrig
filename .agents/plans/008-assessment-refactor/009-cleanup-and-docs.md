# Cleanup and Docs

## Brief

Finalize the refactor by removing obsolete code, aligning exports/imports, updating documentation, and validating the application through checks and smoke tests.

## Tasks

- [ ] Remove Dead Code: Delete leftover helpers, unused imports, and legacy component fragments from `Assessment.tsx` and related files.
- [ ] Normalize Imports/Exports: Update barrel files and module exports to reflect the new structure.
- [ ] Refresh Documentation: Update README/architectural notes to describe the modular assessment structure.
- [ ] Verify Build and Lint: Run the project’s build, lint, and type-check commands.
- [ ] Perform Manual Smoke Tests: Exercise key flows in the dev environment to confirm behavior.
- [ ] Summarize Changes: Prepare a concise summary or changelog entry outlining the refactor.

### Remove Dead Code

Scan for obsolete utilities or leftover JSX in `Assessment.tsx` and new modules, deleting anything no longer used. Confirm with TypeScript and linting to avoid regressions.

#### Notes

Keep git history readable by removing code in discrete commits/stages where possible.

### Normalize Imports/Exports

Update index files or barrel exports to include new components and remove old ones. Ensure import paths across the repo reflect the new locations.

#### Notes

Consider adding comments or TODOs if additional packages need to adopt the new modules.

### Refresh Documentation

Revise relevant docs (package README, ADRs, or internal docs) to explain the new component layout and reuse expectations.

#### Notes

Include diagrams or references produced during earlier steps if helpful.

### Verify Build and Lint

Run commands such as `pnpm typecheck`, `pnpm lint`, and `pnpm build` (adjust as necessary) to ensure code quality checks pass.

#### Notes

Capture any failures for follow-up fixes.

### Perform Manual Smoke Tests

Launch the development environment, navigate through model setup, datasource selection, running an assessment, and viewing results to confirm functionality.

#### Notes

Explicitly exercise result message view toggles (JSON/Markdown/Raw) to confirm the unified `ResultMessage` rendering still behaves correctly. Record any behavioural differences for further action.

### Summarize Changes

Draft a change summary or release note highlighting key refactor outcomes, new components, and testing additions.

#### Notes

This summary can seed future PR descriptions or changelog entries.

## Questions

None.

## Notes

If outstanding issues remain, capture them as follow-up tasks or GitHub issues.

## ADRs

None.
