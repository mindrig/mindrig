# Implement Map and Resolver Logic

## Brief

Build the resolver module that reconciles parsed prompts with the persistent map, matches prompts via content/distance heuristics, and produces canonical playground state outputs with thorough unit coverage.

## Tasks

- [x] Install dependencies: Add `fastest-levenshtein` to the VS Code extension package (`pnpm -F vscode add fastest-levenshtein`) before implementing distance matching helpers.
- [x] Scaffold resolver module: Establish `pkgs/vsc-extension/src/aspects/playground/resolve.ts` exporting all resolver entry points.
- [x] Implement map reconciliation helpers: Code `resolveFilePromptsMap`, `matchPlaygroundMapFile`, prompt matching helpers, and supporting utilities per flow charts.
- [x] Implement playground state resolver: Implement `resolvePlaygroundState` and ancillary logic for pin/cursor selection while keeping structures immutable.
- [x] Add resolver test suites: Write targeted unit tests in `resolve.test.ts` covering map reconciliation, matching heuristics (including threshold tuning), and state decisions.
- [x] Validate types, tests, lint, and formatting: After completing implementation tasks, run repository checks covering core and extension packages.

### Install dependencies

Add `fastest-levenshtein` to the VS Code extension package by running:

```bash
pnpm -F vscode add fastest-levenshtein
```

Update `pkgs/vsc-extension/vite.config.ts` to list `fastest-levenshtein` in the `external` array so the bundle treats it as a dependency instead of bundling it.

### Scaffold resolver module

Create the resolver source file exporting the functions named in the plan, wiring TypeScript module boundaries (imports from `@wrkspc/core/playground`, `fastest-levenshtein`, etc.) and ensuring tree-shakable structure. Include internal types for intermediate data (e.g., match sets) guided by the spec.

#### Notes

Add barrel re-exports if other aspects already import from `@/playground/resolve`.
Ensure exported function names and signatures mirror the definitions captured in `./000-plan.md`.

### Implement map reconciliation helpers

Follow the flow charts to code pure, side-effect-free helpers for map resolution, matching by content/distance, and scoring. Maintain clear separation between matching phases, returning new map objects while tracking updated timestamps and reasons (`MatchingReason`).

#### Notes

Guard against mutated inputs by cloning map structures before updates.
Match helper signatures and return types exactly to the plan brief (`./000-plan.md`).

### Implement playground state resolver

Implement `resolvePlaygroundState` orchestrating map updates, current prompt selection, and pin handling. Ensure the resolver respects pinned prompts, cursor-derived fallbacks, and defaulting rules for empty states, emitting a full `PlaygroundState` payload.

#### Notes

Document any assumptions (e.g., first prompt fallback) inline for future maintenance.
Honor the precise function signature and output contract described in `./000-plan.md`.

### Add resolver test suites

Author `resolve.test.ts` with describe blocks per helper, constructing fixture prompts/map snapshots to assert matching outcomes, matching scores, and overall state resolution across event scenarios. Fold Levenshtein threshold tuning into these tests—when you discover a failing scenario, add it as a fixture and adjust the threshold/constants within the code and assertions so regressions are caught by CI.

#### Notes

Favor table-driven tests to cover multiple matching permutations without excessive duplication, and keep any threshold-specific fixtures alongside the tests (e.g., JSON in `__tests__`) for reproducibility.

### Validate types, tests, lint, and formatting

After the resolver code and tests are ready, execute:

- `pnpm -F @wrkspc/core types`
- `pnpm -F vscode types`
- `pnpm vitest run --project @wrkspc/core`
- `pnpm vitest run --project vscode`
- `pnpm -F @wrkspc/core lint`
- `pnpm -F vscode lint`
- `pnpm -F @wrkspc/core format`
- `pnpm -F vscode format`

Confirm these pass before proceeding to the integration step.

## Questions

None.

## ADRs

None.
