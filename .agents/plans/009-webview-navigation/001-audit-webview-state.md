# Assess Current Webview State

## Brief

Catalog the existing screens, state containers, and persistence mechanisms in the VS Code webview so we understand which user inputs must survive navigation changes.

## Tasks

- [x] Inventory entry layout and routing points: Trace `App.tsx` and related layout components to document how the index view is composed today.
- [x] Audit state providers and hooks: Map the stores, contexts, and reducers that drive prompt playground data, including selected data sources, variables, and CSV selection.
- [x] Review current persistence logic: Identify where local storage or extension messaging already saves or restores state, noting coverage gaps.
- [x] Summarize preservation requirements: Produce a short doc outlining which fields must persist across route changes and which modules own them.

### Inventory entry layout and routing points

Open `pkgs/vsc-webview/src/app/App.tsx` and any imported layout or shell components to record how the main screen renders, capturing opportunities to introduce hash routing boundaries.

#### Notes

- `pkgs/vsc-webview/src/app/App.tsx` already wraps the tree in `BrowserRouter` and mounts a `RouterProvider` bridge for `react-aria-components` navigation, rendering `<Index />` under both `/index.html` (VS Code webview) and `/` (Vite dev server).
- `<Context>` layers `VscProvider`, `MessageProvider`, `ModelsProvider`, and `SettingsProvider` above the route content, so replacing `BrowserRouter` with `HashRouter` must preserve these wrappers and continue to expose `navigate` via `RouterProvider`.
- `<Layout>` is a trivial wrapper (`<div>{children}</div>`), so auth integration will need to build structure on top of it.

### Audit state providers and hooks

Inspect the hooks and providers under `pkgs/vsc-webview/src` (e.g., context files, Zustand stores) to list the exact pieces of user-editable state that need persistence.

#### Notes

- Critical in-memory state today lives inside `Index.tsx`: `fileState`, `activeFile`, `prompts`, `gatewaySecretState`, `isGatewayFormOpen`, `pinnedPrompt`, `vercelPanelOpenSignal`, parsing status flags, and CSV/prompt resolution helpers.
- Global providers contribute additional state: `ModelsProvider` manages available models, gateway key status, and retry logic; `SettingsProvider` and `MessageProvider` coordinate VS Code messaging and configuration; `VscProvider` exposes the `vsc` host bridge (`postMessage`, `setState`, etc.).
- Auth form UX (`AuthVercel`) manages its own visibility and editing flags (`inputValue`, `isVisible`, `isEditing`, `pendingAutoHide`, etc.), which will move into the auth route but should keep their component-level state.

### Review current persistence logic

Search for local storage usage and message handlers that sync prompt state; note what triggers saves, what keys are used, and any missing data.

#### Notes

- `Index.tsx` persists pinned prompt state via `vsc.setState`/`vsc.getState`, so the VS Code webview retains selection between reloads; no other in-app stores currently sync through that channel.
- The only `localStorage` usage lives in `aspects/assessment/persistence.ts`, which saves prompt playground snapshots (`PlaygroundState`) keyed by `mindrig.playground.prompts`. Persistence currently hinges on explicit `savePromptState` invocations rather than global listeners.
- No bespoke `hashchange` listeners exist—the router handles route resolution—so adopting `HashRouter` means swapping router primitives while keeping the same persistence touchpoints.

### Summarize preservation requirements

Compile a concise summary (bullet list) of all data that must persist and the gaps to address in later steps; store it in this step file or a linked doc for execution reference.

#### Notes

- Persist across routes: prompt playground configurations (model configs, variables, CSV selection, dataset mode/range, execution results, layout), pinned prompt snapshots (via VS Code webview state), gateway key visibility/editing state where feasible, and assessment inputs pulled from `PlaygroundState`.
- Navigation must continue to surface index view by default for both `/` and `/index.html`, while also supporting `#/auth` (or `/auth` under hash) without breaking the dev-server path assumptions.
- Adding HashRouter will require providing typed route constants for `"/"` and `"/auth"`, bridging `RouterProvider` navigation, and ensuring VS Code serialization (`vsc.setState`) is unaffected by route transitions.

## Questions

None.

## Notes

Capture any VS Code messaging constraints encountered so later steps can account for them.

## ADRs

None.
