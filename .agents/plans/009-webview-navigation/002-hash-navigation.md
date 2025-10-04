# Adopt React Router Hash Navigation

## Brief

Plan the migration from the bespoke hash listener to React Router's `HashRouter` so index and auth routes render via declarative `<Route>` components while preserving VS Code webview (`index.html`) and Vite dev server (`/`) compatibility.

## Tasks

- [ ] Confirm dependency footprint: Verify `react-router-dom` is available at the desired version or document adding it to the webview package with bundler considerations.
- [ ] Define route schema: Map hash segments (`/`, `/auth`) to route metadata and TypeScript helpers that other modules can reuse safely.
- [ ] Integrate HashRouter shell: Outline wrapping the root with `<HashRouter hashType="slash">` and `<Routes>`, configure default redirects for blank or unknown hashes, and ensure initial load works for both entrypoints.
- [ ] Replace manual navigation utilities: Specify how to surface React Router hooks (`useNavigate`, `useLocation`) via shared helpers or context so existing components can navigate programmatically.
- [ ] Retire legacy listeners: Document which bespoke hash listeners or stores must be removed or adapted to prevent duplicate state updates.

### Confirm dependency footprint

Check the webview package's dependencies to confirm `react-router-dom` (and matching `react-router`) are present, and note any required version bumps or tree-shaking considerations for the lightweight bundle.

#### Notes

Call out any bundler configuration updates (e.g., Vite aliasing) needed after adding the dependency.

### Define route schema

Establish constants or enums for the supported routes, align them with React Router path strings, and describe how to centralize them for reuse by navigation helpers and tests.

#### Notes

Plan for future expansion by leaving room for additional routes without breaking type safety.

### Integrate HashRouter shell

Detail how to wrap the app render tree with `<HashRouter hashType="slash">`, declare `<Routes>` for index and auth screens, add a `<Navigate>` fallback for unknown hashes, and verify the setup works when the base pathname is `/index.html` (webview) or `/` (dev server).

#### Notes

Include a reminder to confirm that static asset paths remain valid in both environments after the router wrapper is added.

### Replace manual navigation utilities

Describe how to convert any existing navigation helpers to use `useNavigate` (including history back behavior) and how to expose typed wrappers for contexts or modules that cannot consume hooks directly.

#### Notes

Note whether global message handlers need to trigger navigation and how they will access the React Router helpers.

### Retire legacy listeners

List the current custom hash listeners, event subscriptions, or shared state atoms that should be removed or bridged, and explain how to avoid race conditions during the transition.

#### Notes

Highlight any cleanup tasks to ensure only React Router controls the hash to prevent redundant renders.

## Questions

None.

## Notes

Account for VS Code messaging that might need to respond to route changes by plugging into React Router's navigation events.

## ADRs

None.
