# Integrate Extension Events

## Brief

Embed the resolver into the VS Code extension by introducing a `PlaygroundManager` that reacts to editor lifecycle events, persists map/pin state, and broadcasts `playground-ext-state` messages with supporting tests and store updates.

## Tasks

- [x] Implement PlaygroundManager skeleton: Define the manager class in `pkgs/vsc-extension/src/aspects/playground/Manager.ts` with constructor wiring and state fields.
- [x] Handle editor-driven events: Connect active-change, cursor-update, file-save, and file-update hooks to resolver calls while respecting pin rules.
- [x] Persist playground map and pin: Integrate `StoreManager` accessors to load/save map snapshots and ensure workspace scope persistence.
- [x] Wire extension registration: Register the manager within `pkgs/vsc-extension/src/aspects/extension/Manager.ts` and expose state to the store/webview messaging pipeline.
- [x] Update shared client state: Replace prompt fragments with `PlaygroundState` in `pkgs/core/src/client/state.ts` and update consumers (e.g., `EditorStateManager`).
- [x] Add manager test suite: Create `Manager.test.ts` covering event dispatch, resolver usage, persistence behavior, and message emissions.
- [x] Validate types, tests, lint, and formatting: After integration changes, execute repository checks for the core and VS Code packages.

### Implement PlaygroundManager skeleton

Author the class structure extending the base `Manager`, accepting dependencies (`MessagesManager`, `EditorManager`, `PromptsManager`, `StoreManager`) and holding private fields for `PlaygroundMap`, pin ref, and resolved state. Provide public getters and internal helpers aligning with the plan signature.

#### Notes

Ensure manager initialization reads persisted map before subscribing to events to avoid race conditions.

Mirror constructor shape, private field names, and method signatures given in `./000-plan.md`.

### Handle editor-driven events

Attach listeners (or override hooks) for active file, cursor, save, and document change events. Within each handler, implement the decision flow from the architecture chart to skip resolves when pinned or to trigger prompt parsing + resolver updates, emitting messages on state change.

#### Notes

Leverage existing `PromptsManager` parsing APIs to avoid duplication.

Use the method names and payload contracts provided in the main plan brief to keep handlers aligned.

### Persist playground map and pin

Use `StoreManager` to hydrate in-memory state, set up debounced persistence on updates, and ensure pin references survive reloads. Handle store schema updates to include `playground` and `pin` keys without breaking existing data.

#### Notes

Add guard logic for legacy store payloads that might not yet include playground data.

### Wire extension registration

Instantiate `PlaygroundManager` inside the extension manager bootstrap, register message handlers for `playground-ext-state` requests, and expose the manager through the aspect registry if other components need access.

#### Notes

Keep registration order consistent with other managers to satisfy dependency expectations.

### Update shared client state

Modify core client state types (`pkgs/core/src/client/state.ts`) to incorporate `PlaygroundState`, adjust reducers/selectors, and ensure any code expecting prompt parse results is updated to consume the new state snapshot.

#### Notes

Ignore `pkgs/vsc-webview` and don't change anything there as we will handle webview integration in a future plan.

### Add manager test suite

Build `Manager.test.ts` to mock dependencies, simulate event sequences, and assert resolver invocations, message dispatches, and persistence writes. Cover pin toggling flows and state request handling.

#### Notes

Use Vitest Fake Timers to validate persistence debounce behavior if introduced.

### Validate types, tests, lint, and formatting

Once integration work is complete, run:

- `pnpm -F @wrkspc/core types`
- `pnpm -F vscode types`
- `pnpm vitest run --project @wrkspc/core`
- `pnpm vitest run --project vscode`
- `pnpm -F @wrkspc/core lint`
- `pnpm -F vscode lint`
- `pnpm -F @wrkspc/core format`
- `pnpm -F vscode format`

Ensure the commands succeed before concluding the plan.

## Questions

None.

## ADRs

None.
