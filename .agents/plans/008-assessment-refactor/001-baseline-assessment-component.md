# Baseline Assessment Component

## Brief

Understand the full behavior of `pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx`, cataloging state, side effects, data dependencies, and rendered subtrees to guide modular extraction.

## Tasks

- [ ] Capture Top-Level Structure: Outline sections, helper hooks, and major rendering branches within `Assessment.tsx`.
- [ ] Map State and Effects: Document all stateful constructs, derived data, and asynchronous effects with their triggers.
- [ ] Inventory External Dependencies: List imported modules, shared services, contexts, and utilities that the component consumes.
- [ ] Summarize UI Responsibilities: Record the user-facing features and interactions the current component supports.

### Capture Top-Level Structure

Open `pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx` and sketch the current layout: identify major React components or inline render blocks, helper functions, and conditional branches. Save the outline in step notes or a scratch document referenced from this plan.

#### Notes

Include line references for especially complex sections to speed up future navigation.

### Map State and Effects

Catalog every `useState`, `useReducer`, `useMemo`, `useCallback`, `useEffect`, and custom hook invocation. Record what each piece of state represents, how it is updated, and which UI regions consume it. Note dependencies between state pieces and side effects.

#### Notes

Highlight any state that already resembles the future module boundaries (e.g., model configuration vs. datasource management).

### Inventory External Dependencies

List all imports that the component relies on, grouping them by responsibility (services, contexts, UI components, utilities, constants). Flag any dependencies that may need to move or be wrapped when the component is split.

#### Notes

Pay attention to shared mutable stores or singleton services that could complicate modularization.

### Summarize UI Responsibilities

Document each interaction the UI currently provides (model configuration, datasource selection, running assessments, viewing results, error states). Capture how these flows are initiated and what state they depend on.

#### Notes

Note any implicit UX requirements such as loading indicators, validation, or error handling that must be preserved.

## Questions

None.

## Notes

Store collected findings either within this file or link to a dedicated research note so later steps can reference the baseline quickly.

## ADRs

None.
