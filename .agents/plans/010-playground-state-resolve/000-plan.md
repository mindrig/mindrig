# Playground State Resolution

## Brief

- Contracts: define `PlaygroundMap`, `PlaygroundState`, and `VscMessagePlayground.ExtResolve` so the extension can emit a canonical playground snapshot to the webview.
- Algorithms: implement `resolveFilePromptsMap`, `matchFile`, `matchPrompts`, `resolvePlaygroundState`, and supporting helpers that follow the flow charts for prompt reconciliation.
- Extension glue: wire editor lifecycle events into a `PlaygroundManager` that tracks pin state and dispatches `playground-ext-resolve` updates without yet touching the client.
- Testing (top-level): map heuristics suite covering prompt content/distance matching, state resolution suite validating selection and pin decisions per trigger, extension messaging suite ensuring resolve events fire on active-change, cursor-update, file-save, and file-update.

## Steps

- [x] [Define Playground Contracts](.agents/plans/010-playground-state-resolve/001-core-contracts.md): Specify shared playground types, message envelopes, and architecture doc updates reflecting the pared-down resolve payload and ID-focused map.
- [ ] [Implement Map and Resolver Logic](.agents/plans/010-playground-state-resolve/002-map-logic.md): Build the resolving functions, constants, and helpers that update the map, match prompts, and return resolved payloads, with focused unit coverage.
- [ ] [Integrate Extension Events](.agents/plans/010-playground-state-resolve/003-extension-integration.md): Add a playground manager that applies the resolver to editor events, handles pin toggles, and exercises the flow through unit tests of the VS Code extension layer.

### [Define Playground Contracts](.agents/plans/010-playground-state-resolve/001-core-contracts.md)

#### `PlaygroundState`

Create `pkgs/core/src/playground/state.ts` exporting the `PlaygroundState` namespace backed by the existing `EditorFile` types:

```ts
import type { EditorFile } from "../editor/index.js";
import type { PlaygroundMap } from "../map/index.js";

export interface PlaygroundState {
  file: EditorFile.Meta | null;
  prompt: PlaygroundState.Prompt | null;
  prompts: PlaygroundState.PromptItem[];
  pin: PlaygroundState.Ref | null;
}

export namespace PlaygroundState {
  export interface PromptItem {
    fileId: EditorFile.Id;
    promptId: PlaygroundMap.PromptId;
    preview: string;
  }

  export interface Prompt {
    fileId: EditorFile.Id;
    promptId: PlaygroundMap.PromptId;
    content: string;
    reason: PromptReason;
  }

  export type PromptReason = "pinned" | "cursor";

  export interface Ref {
    fileId: EditorFile.Id;
    promptId: PlaygroundMap.PromptId;
  }
}
```

`PlaygroundState.PromptItem["preview"]` is a trimmed version of the prompt content for display in the prompts select UI.

Only prompt content and identifiers travel over the wire; heavier state (model configs, datasets, execution history, layout) remains client-owned and keyed by `Prompt["fileId"]` and `Prompt["promptId"]`.

Update `pkgs/core/src/editor/file.ts` to expose `EditorFile.Meta` (existing `EditorFile` should extend `EditorFile.Meta`) so the shared state can depend on that meta subset rather than duplicating fields.

#### `PlaygroundMap`

Author `pkgs/core/src/playground/map.ts` exporting a `PlaygroundMap` namespace for resolver bookkeeping:

```ts
import type { EditorFile } from "../editor/index.js";

export interface PlaygroundMap {
  files: Record<EditorFile.Path, File>;
  updatedAt: number;
}

export namespace PlaygroundMap {
  export type FileId = string & { [fileIdBrand]: true };
  declare const fileIdBrand: unique symbol;

  export type PromptId = string & { [promptIdBrand]: true };
  declare const promptIdBrand: unique symbol;

  export interface File {
    id: FileId;
    path: EditorFile.Path;
    updatedAt: number;
    prompts: Prompt[];
  }

  export interface Prompt {
    id: PromptId;
    content: string;
    updatedAt: number;
  }

  export interface Matching {
    reason: MatchingReason;
    score: number;
  }

  export type MatchingReason = "content" | "distance" | "new";
}
```

IDs follow the unique-symbol branding pattern used elsewhere in core (e.g., `AttachmentRequest.Id`), and map state keeps only what is required for prompt reconciliation.

Update `pkgs/core/src/editor/file.ts` to use branded path string `EditorFile.Path` for paths.

#### Messages

Update `pkgs/core/src/message/message/playground.ts`:

```ts
import { PlaygroundState } from "../../playground/index.js";

export namespace VscMessagePlayground {
  //#region Extension

  export type Extension = ExtState;

  export interface ExtState {
    type: "playground-ext-state";
    payload: PlaygroundState;
  }

  //#endregion

  //#region Webview

  export type Webview = WvRequestState | WvPin | WvUnpin;

  export interface WvRequestState {
    type: "playground-wv-request-state";
  }

  export interface WvPin {
    type: "playground-wv-pin";
    payload: PlaygroundState.Ref;
  }

  export interface WvUnpin {
    type: "playground-wv-unpin";
  }

  export interface WvPromptChange {
    type: "playground-wv-prompt-change";
    payload: PlaygroundState.Ref;
  }

  //#endregion
}
```

Register the new message types within `pkgs/core/src/message/message.ts`, and revise the architecture documents to call out the separation between `PlaygroundState` (shared payload) and `PlaygroundMap` (server-only ID map).

#### Tasks

- [x] Audit editor and message types: Reviewed `pkgs/core/src/editor/file.ts` and message modules to confirm the required hooks for new playground contracts.
- [x] Author playground state namespace
- [x] Author playground map namespace
- [x] Author messages
- [x] Expose playground module entrypoints
- [x] Validate types, tests, lint, and formatting

#### Status

Completed. Core now publishes the shared `PlaygroundState` and `PlaygroundMap` namespaces plus the `VscMessagePlayground` envelope, with package exports refreshed, architecture docs updated, and repo checks (types, tests, lint, format) passing.

### [Implement Map and Resolver Logic](.agents/plans/010-playground-state-resolve/002-map-logic.md)

#### Resolver module

Create `pkgs/vsc-extension/src/aspects/playground/resolve.ts`:

```ts
import { PlaygroundState } from "@wrkspc/core/playground/state";
import { PlaygroundMap } from "@wrkspc/core/playground/map";
import { Prompt } from "@mindrig/types";
import { EditorFile } from "@wrkspc/core/editor";

export namespace ResolvePlaygroundState {
  export interface Props {
    timestamp: number;
    map: PlaygroundMap;
    file: EditorFile.EditorFile | null;
    parsedPrompts: Prompt[];
    pin: PlaygroundState.Ref | null;
  }
}

export function resolvePlaygroundState(
  props: ResolvePlaygroundState.Props
): PlaygroundState;

export namespace ResolveFilePromptsMap {
  export interface Props {
    timestamp: number;
    map: PlaygroundMap;
    file: EditorFile | null;
    parsedPrompts: Prompt[];
  }
}

export function resolveFilePromptsMap(
  props: ResolveFilePromptsMap.Props
): PlaygroundMap;

export namespace MatchPlaygroundMapFile {
  export interface Props {
    timestamp: number;
    map: PlaygroundMap;
    file: EditorFile;
    parsedPrompts: Prompt[];
  }
}

export function matchPlaygroundMapFile(
  props: MatchPlaygroundMapFile.Props
): PlaygroundMap.File | null;

export namespace MatchPlaygroundMapFileByDistance {
  export interface Props {
    map: PlaygroundMap;
    parsedPrompts: Prompt[];
  }
}

export function matchPlaygroundMapFileByDistance(
  props: MatchPlaygroundMapFileByDistance.Props
): PlaygroundMap.File | null;

export namespace MatchPlaygroundMapPrompts {
  export interface Props {
    mapPrompts: PlaygroundMap.Prompt[];
    parsedPrompts: Prompt[];
  }

  export interface Result {
    nextPrompts: PlaygroundMap.Prompt[];
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
    matchingScore: number;
  }
}

export function matchPlaygroundMapPrompts(
  props: MatchPlaygroundMapPrompts.Props
): MatchPlaygroundMapPrompts.Result;

export namespace MatchPlaygroundMapPromptsByContent {
  export interface Props {
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }

  export interface Result {
    matchedMapPrompts: PlaygroundMap.Prompt[];
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }
}

export function matchPlaygroundMapPromptsByContent(
  props: MatchPlaygroundMapPromptsByContent.Props
): MatchPlaygroundMapPromptsByContent.Result;

export namespace MatchPlaygroundMapPromptsByDistance {
  export interface Props {
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }

  export interface Result {
    matchedMapPrompts: PlaygroundMap.Prompt[];
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }
}

export function matchPlaygroundMapPromptsByDistance(
  props: MatchPlaygroundMapPromptsByDistance.Props
): MatchPlaygroundMapPromptsByDistance.Result;

export namespace CalcMatchingPromptsScore {
  export interface Props {
    matchedMapPrompts: PlaygroundMap.Prompt[];
    unmatchedMapPrompts: Set<PlaygroundMap.Prompt>;
    unmatchedParsedPrompts: Set<Prompt>;
  }
}

export function calcMatchingPromptsScore(
  props: CalcMatchingPromptsScore.Props
): number;
```

Use `fastest-levenshtein` for distance comparisons, calibrating thresholds with sample prompts during execution. Ensure helpers return new structures (no mutation) except where the manager commits map updates.

Map hygiene rules:

- Remove prompts absent from the latest parsed set.
- Update `PlaygroundMap["updatedAt"]`, `PlaygroundMap.File["updatedAt"]`, and `PlaygroundMap.Prompt["updatedAt"]` when changes occur.
- Maintain prompt contents in sync with the latest parsed source.

#### Testing

Implement unit suites under `pkgs/vsc-extension/src/aspects/playground/resolve.test.ts` testing each `pkgs/vsc-extension/src/aspects/playground/resolv.ts` function individually:

```ts
describe(matchPlaygroundMapPromptsByContent, () => {
  // ...
});
```

#### Status

TODO

### [Integrate Extension Events](.agents/plans/010-playground-state-resolve/003-extension-integration.md)

#### Extension manager

Implement `pkgs/vsc-extension/src/aspects/playground/Manager.ts` coordinating editor events, prompt parsing, pinning, playground state and message requests:

```ts
import { PlaygroundState, PlaygroundMap } from "@wrkspc/core/playground";
import { MessagesManager } from "../message/Manager.js";
import { EditorManager } from "../editor/Manager.js";
import { PromptsManager } from "../prompts/Manager.js";

export namespace PlaygroundManager {
  export interface Props {
    messagesManager: MessagesManager;
    editorManager: EditorManager;
    promptsManager: PromptsManager;
    storeManager: StoreManager;
  }
}

export class PlaygroundManager extends Manager {
  #map: PlaygroundMap;
  #pin: PlaygroundState.Ref | null;
  #state: PlaygroundState;
  #messagesManager: MessagesManager;
  #editorManager: EditorManager;
  #promptsManager: PromptsManager;
  #storeManager: StoreManager;

  constructor(parent: Manager, props: PlaygroundManager.Props);

  get state(): PlaygroundState;

  #onActiveChange(file: EditorFile | null): Promise<void>;
  #onCursorUpdate(file: EditorFile): Promise<void>;
  #onFileSave(file: EditorFile): Promise<void>;
  #onFileUpdate(file: EditorFile): Promise<void>;
  #onRequestState(): Promise<void>;
  #onPin(ref: PlaygroundState.Ref): Promise<void>;
  #onUnpin(): Promise<void>;
  #onPromptChange(ref: PlaygroundState.Ref): Promise<void>;
}
```

Update `pkgs/core/src/store/store.ts` to register `"playground"?: PlaygroundMap | undefined` and `"pin"` within the `Store` schema so it can be persisted by `StoreManager`.

Responsibilities:

- Maintain pin and map.
- Use `StoreManager` to initially read and persist `PlaygroundMap` in the workspace scope, mutating it only after updates.
- Keep map and pin in-memory for quick access.
- Handle events and webview messages.
- On `cursor-update` and `file-change`, use the cursor position to detect the active prompt.
- Respect the architecture flow chart: skip recomputation when pinned prompts should ignore events, otherwise call `resolvePlaygroundState`.
- On each successful resolve and pin change, broadcast `VscMessagePlayground.ExtState`.

Wire the manager into `pkgs/vsc-extension/src/aspects/extension/Manager.ts`.

#### Client State Integration

Integrate `PlaygroundState` into the `ClientState` in `pkgs/core/src/client/state.ts`:

- Replace `prompts: PromptParse.Result` with `playground: PlaygroundState`.
- Update `EditorStateManager` to include and consume state from `PlaygroundManager`.

#### Manager tests

Author `pkgs/vsc-extension/src/aspects/playground/Manager.test.ts` exercising:

- Events handling.
- Store persistence.

Mock dependencies (VS Code APIs, `MessagesManager`, `EditorManager`, `PromptsManager`, `StoreManager`, etc.) to isolate the manager logic. Keep the mocks minimal and targeted, preferring spies and `any` (in case of type mismatches) to verify interactions, avoiding lengthy stubs.

#### Status

TODO

## Questions

None.

## Notes

- Ignore the existing webview persistence schema (`pkgs/vsc-webview/src/aspects/assessment/persistence.ts`) and use the resolver outputs as the canonical playground snapshot delivered to the client.
- Align resolver logic strictly with the flow charts in `docs/architecture/playground-state-resolve.md`.

## Prompt

Plan playground state resolve. We're not going to integrate them with the client yet. We just need to:

1. Write the functions with unit tests inside `pkgs/vsc-extension` strictly following the architecture documents linked below.
2. Add required messages to `pkgs/core/src/message/message/playground.ts` and common types to `pkgs/core/src/playground/state.ts`.
3. Update the extension in `pkgs/vsc-extension` to wire the needed events and add unit tests checking that the events react properly.

Use `docs/architecture/server-client-responsibilities.md` and `docs/architecture/playground-state-resolve.md` as the spec of the functions. I want exact data structures (common types, messages, ) to be a part of the plan, so I can review them. In the brief, just give me high-level overview (names, purpose), we'll detail them when we proceed to steps planning. Also use same approach (top-level, details) for the testing plan, so I can be sure you approach it correctly during the execution.

Before you proceed to writing the plan, make sure to carefully review the flow charts.

You should ignore the existing webview persistence schema and design it from scratch.

## Follow-Ups

None.
