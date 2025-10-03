# Extract Model Setup Module

## Brief

Implement the dedicated model configuration components (`ModelSetups`, `ModelSetup`, `ModelSelector`, `ModelSettings`) and migrate existing model-related logic out of `Assessment.tsx` while preserving functionality.

## Tasks

- [x] Scaffold Model Components: Create the new files with exports and placeholder structures wired into the package barrel if needed.
- [x] Migrate Model State Logic: Relocate model configuration hooks, defaults, and validation into the new module.
- [x] Implement Selector and Settings UI: Port provider/model selection controls and settings panel into `ModelSelector` and `ModelSettings`.
- [x] Rewire Assessment Usage: Replace inlined model configuration in `Assessment.tsx` with the new `ModelSetups` integration.
- [x] Add Module Tests: Cover model selection workflows with React Testing Library tests.

### Scaffold Model Components

Create `src/aspects/model/Setups.tsx`, `Setup.tsx`, `Selector.tsx`, and `Settings.tsx` with typed props that align with the architecture decisions. Ensure each file exports its component, and update any index files that aggregate exports.

#### Notes

Added `Setups.tsx`, `Setup.tsx`, `Selector.tsx`, and `Settings.tsx` under `src/aspects/model/`, exporting typed components plus shared interfaces for configs, options, and capabilities.

### Migrate Model State Logic

Move the related state hooks and helper functions from `Assessment.tsx` into the appropriate new components or supporting hooks. Maintain the existing behavior while simplifying prop chains where possible.

#### Notes

Implemented `useModelSetupsState` hook to own configs, errors, expansion state, and mutation helpers; moved creation/update logic out of `Assessment.tsx` to minimise prop plumbing.

### Implement Selector and Settings UI

Port the JSX for provider/model selects and settings controls into `ModelSelector` and `ModelSettings`, ensuring handlers and validation continue to operate as before.

#### Notes

Lifted the existing JSX into `ModelSelector`, `ModelSettings`, and `ModelSetup`, preserving class names and conditional render paths while exposing callbacks via props.

### Rewire Assessment Usage

Integrate `ModelSetups` back into `Assessment.tsx`, passing the necessary callbacks and data. Remove redundant code from the parent component after verifying functionality.

#### Notes

Swapped the monolithic model block in `Assessment.tsx` for the new `ModelSetups` component, updating persistence, hydration, and attachment handlers to consume the hook APIs.

### Add Module Tests

Write React Testing Library tests that exercise typical model configuration flows (selecting providers/models, adjusting settings). Place tests alongside the new components or in the repository’s preferred test directory.

#### Notes

Introduced `ModelSetups.test.tsx` covering component interactions and `useModelSetupsState` behaviour with Vitest/Testing Library.

## Questions

None.

## Notes

Coordinate with later shared-state integration to avoid duplicating context logic; document any temporary bridges that require cleanup.

## ADRs

None.
