# Adopt React Router Hash Navigation

## Brief

Plan the migration from the bespoke hash listener to React Router's `HashRouter` so index and auth routes render via declarative `<Route>` components while preserving VS Code webview (`index.html`) and Vite dev server (`/`) compatibility.

## Tasks

- [x] Confirm dependency footprint: Verify `react-router-dom` is available at the desired version or document adding it to the webview package with bundler considerations.
- [x] Define route schema: Map hash segments (`/`, `/auth`) to route metadata and TypeScript helpers that other modules can reuse safely.
- [x] Integrate HashRouter shell: Outline wrapping the root with `<HashRouter hashType="slash">` and `<Routes>`, configure default redirects for blank or unknown hashes, and ensure initial load works for both entrypoints.
- [x] Replace manual navigation utilities: Specify how to surface React Router hooks (`useNavigate`, `useLocation`) via shared helpers or context so existing components can navigate programmatically.
- [x] Retire legacy listeners: Document which bespoke hash listeners or stores must be removed or adapted to prevent duplicate state updates.

### Confirm dependency footprint

Check the webview package's dependencies to confirm `react-router-dom` (and matching `react-router`) are present, and note any required version bumps or tree-shaking considerations for the lightweight bundle.

#### Notes

- `react-router-dom@^7.8.2` (with matching `react-router`) was already listed in `@wrkspc/vsc-webview/package.json`; no dependency or bundler changes required.

### Define route schema

Establish constants or enums for the supported routes, align them with React Router path strings, and describe how to centralize them for reuse by navigation helpers and tests.

#### Notes

- Added `pkgs/vsc-webview/src/app/routes.ts` with `APP_ROUTE_CONFIG`, typed helpers (`getRoutePath`, `resolveRouteKey`, `normaliseRoutePath`), and default route metadata; `/index.html` remains an alias for the index route to preserve VS Code compatibility.
- Exported `AppRouteKey`/`AppRoutePath` unions so future routes can extend the config without breaking consumers.

### Integrate HashRouter shell

Detail how to wrap the app render tree with `<HashRouter hashType="slash">`, declare `<Routes>` for index and auth screens, add a `<Navigate>` fallback for unknown hashes, and verify the setup works when the base pathname is `/index.html` (webview) or `/` (dev server).

#### Notes

- Swapped `BrowserRouter` for `HashRouter` (`hashType="slash"`) in `App.tsx`, continuing to wrap the tree in `Context` and `RouterProvider`.
- `<Routes>` now declares index, alias (`/index.html`), and auth paths with a trailing catch-all redirect to `/`; the hash router ignores the underlying document path so both `/` (dev server) and `/index.html` (webview) load correctly.

### Replace manual navigation utilities

Describe how to convert any existing navigation helpers to use `useNavigate` (including history back behavior) and how to expose typed wrappers for contexts or modules that cannot consume hooks directly.

#### Notes

- Introduced `useAppNavigation` in `app/navigation.ts`, exposing typed `navigateTo`, `replaceWith`, and `goBackOrIndex` helpers that wrap `useNavigate` and `useLocation` while guarding against history underflow.
- Helpers return the canonical route key/path so shared components can consume navigation without importing React Router directly.

### Retire legacy listeners

List the current custom hash listeners, event subscriptions, or shared state atoms that should be removed or bridged, and explain how to avoid race conditions during the transition.

#### Notes

- No bespoke hash listeners existed—existing routing already relied on React Router—so no additional cleanup was required beyond removing `BrowserRouter` usage.

## Questions

None.

## Notes

Account for VS Code messaging that might need to respond to route changes by plugging into React Router's navigation events.

## ADRs

None.
