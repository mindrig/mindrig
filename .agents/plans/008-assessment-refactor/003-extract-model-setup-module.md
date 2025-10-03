# Extract Model Setup Module

## Brief

Implement the dedicated model configuration components (`ModelSetups`, `ModelSetup`, `ModelSelector`, `ModelSettings`) and migrate existing model-related logic out of `Assessment.tsx` while preserving functionality.

## Tasks

- [ ] Scaffold Model Components: Create the new files with exports and placeholder structures wired into the package barrel if needed.
- [ ] Migrate Model State Logic: Relocate model configuration hooks, defaults, and validation into the new module.
- [ ] Implement Selector and Settings UI: Port provider/model selection controls and settings panel into `ModelSelector` and `ModelSettings`.
- [ ] Rewire Assessment Usage: Replace inlined model configuration in `Assessment.tsx` with the new `ModelSetups` integration.
- [ ] Add Module Tests: Cover model selection workflows with React Testing Library tests.

### Scaffold Model Components

Create `src/aspects/model/Setups.tsx`, `Setup.tsx`, `Selector.tsx`, and `Settings.tsx` with typed props that align with the architecture decisions. Ensure each file exports its component, and update any index files that aggregate exports.

#### Notes

Leverage TypeScript interfaces to capture shared props (e.g., model configuration data) for reuse across components.

### Migrate Model State Logic

Move the related state hooks and helper functions from `Assessment.tsx` into the appropriate new components or supporting hooks. Maintain the existing behavior while simplifying prop chains where possible.

#### Notes

Keep state local to the highest component that needs it, using lifting only where other modules require access.

### Implement Selector and Settings UI

Port the JSX for provider/model selects and settings controls into `ModelSelector` and `ModelSettings`, ensuring handlers and validation continue to operate as before.

#### Notes

Avoid visual changes; reuse current styling classes or components exactly.

### Rewire Assessment Usage

Integrate `ModelSetups` back into `Assessment.tsx`, passing the necessary callbacks and data. Remove redundant code from the parent component after verifying functionality.

#### Notes

Confirm TypeScript types remain consistent after refactor; update reference imports accordingly.

### Add Module Tests

Write React Testing Library tests that exercise typical model configuration flows (selecting providers/models, adjusting settings). Place tests alongside the new components or in the repository’s preferred test directory.

#### Notes

Mock any APIs or contexts as needed to keep tests focused on component behavior.

## Questions

None.

## Notes

Coordinate with later shared-state integration to avoid duplicating context logic; document any temporary bridges that require cleanup.

## ADRs

None.
