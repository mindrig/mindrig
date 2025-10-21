# Define Playground Contracts

## Brief

Capture the shared playground state/map contracts and message envelope updates so extension and webview exchange a canonical snapshot aligned with the architecture spec.

## Tasks

- [x] Audit editor and message types: Confirm existing `EditorFile` exports and playground message stubs so new contracts extend the right shapes.
- [x] Author playground state namespace: Introduce `PlaygroundState` types in `pkgs/core/src/playground/state.ts` that mirror the plan brief.
- [x] Author playground map namespace: Add `PlaygroundMap` types in `pkgs/core/src/playground/map.ts` with branded IDs and timestamp hygiene.
- [x] Author messages: Create `pkgs/core/src/message/message/playground.ts` updating `pkgs/core/src/message/message.ts` unions to use `VscMessagePlayground` messages.
- [x] Expose playground module entrypoints: Add `pkgs/core/src/playground/index.ts` to re-export playground modules and update `pkgs/core/package.json` to publish them.
- [x] Validate types, tests, lint, and formatting: After completing the above tasks, run repository checks to ensure core and extension packages stay healthy.

### Audit editor and message types

Inspect `pkgs/core/src/editor/file.ts` and related exports to identify the existing `EditorFile` shape, add `EditorFile.Meta`, and ensure `EditorFile.Path` branding is feasible.

#### Notes

Reference `docs/architecture/playground-state-resolve.md` while cataloging required fields to keep naming consistent.

### Author playground state namespace

Create `pkgs/core/src/playground/state.ts` exporting the `PlaygroundState` interface/namespace tree from the plan, trimming prompt previews and aligning IDs with `PlaygroundMap`. Ensure exports fit existing barrel modules (e.g., `pkgs/core/src/playground/index.ts`) and include any necessary re-exports.

#### Notes

Add succinct JSDoc where needed to clarify preview vs. full prompt content for downstream consumers.
Follow the shapes specified in `.agents/plans/010-playground-state-resolve/000-plan.md` exactly when defining interfaces and namespaces.

### Author playground map namespace

Create `pkgs/core/src/playground/map.ts` defining `PlaygroundMap` and nested types, adopting unique symbol branding for `FileId` and `PromptId`, and keeping fields immutable by default. Ensure timestamp fields use `number` epoch milliseconds and that map helpers will be able to mutate copies without side effects.

#### Notes

Coordinate file naming with the monorepo style guide (`map.ts`) and update existing index barrels to expose the new namespace.

Preserve type and signature naming exactly as documented in the main plan brief (`./000-plan.md`).

### Author messages

Create `pkgs/core/src/message/message/playground.ts` defining `VscMessagePlayground` from the plan (`./000-plan.md`).

Update `pkgs/core/src/message/message.ts` to include `VscMessagePlayground` in the `VscMessage` unions type.

#### Notes

Align message type names and payload signatures with the definitions in the main plan (`./000-plan.md`) to maintain consistency.

### Expose playground module entrypoints

Create `pkgs/core/src/playground/index.ts` re-exporting the new playground modules (e.g., `export * from "./state.js"; export * from "./map.js";`), and update `pkgs/core/package.json` exports so downstream packages can import the playground namespace cleanly.

#### Notes

Verify the barrel aligns with existing path alias patterns and update any tsconfig references if necessary.

### Validate types, tests, lint, and formatting

Once the implementation tasks are complete, run:

- `pnpm -F @wrkspc/core types`
- `pnpm -F vscode types`
- `pnpm vitest run --project @wrkspc/core`
- `pnpm vitest run --project vscode`
- `pnpm -F @wrkspc/core lint`
- `pnpm -F vscode lint`
- `pnpm -F @wrkspc/core format`
- `pnpm -F vscode format`

Ensure all commands pass before moving to the next plan step.

## Questions

None.

## ADRs

None.
