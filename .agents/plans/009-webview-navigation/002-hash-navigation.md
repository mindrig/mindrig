# Add Hash Navigation Framework

## Brief

Establish hash-based routing utilities that detect URL hash changes, map them to views, and expose programmatic navigation helpers while keeping the index view as the default experience.

## Tasks

- [ ] Define route constants and types: Create a central map of supported hashes (`index`, `auth`) and TypeScript helpers for safe routing.
- [ ] Implement hash change listener: Add a hook or component that watches `window.location.hash`, normalizes it, and updates shared state accordingly with cleanup on unmount.
- [ ] Provide navigation helpers: Expose functions (e.g., `navigateTo(route)`, `navigateBack()`) that update the hash or trigger history back consistent with VS Code constraints.
- [ ] Integrate router context with `App`: Wire the listener and helpers into `App.tsx` so the correct view renders on initial load and subsequent hash changes.

### Define route constants and types

Introduce a `routes.ts` (or similar) within the webview app that enumerates known hashes, related enums/types, and helper guards for unknown hashes.

#### Notes

Keep extensibility in mind for future routes.

### Implement hash change listener

Author a React hook (e.g., `useHashRoute`) that subscribes to `hashchange` events, parses the hash, and updates a route state atom; ensure it handles toggling between blank hash and `#index`.

#### Notes

Remember to remove event listeners on cleanup to avoid leaks.

### Provide navigation helpers

Expose functions for setting the hash, pushing history, and invoking browser `history.back()` so the auth header can navigate appropriately.

#### Notes

Account for environments where history back may not have prior entries by falling back to the index hash.

### Integrate router context with `App`

Wrap `App.tsx` rendering with the new route state, switching between index and auth components based on the current route while preserving existing providers.

#### Notes

Ensure default rendering remains unchanged when no hash is present.

## Questions

None.

## Notes

Consider whether VS Code message passing should be notified on route changes for telemetry or host sync.

## ADRs

None.
