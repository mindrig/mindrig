# Integrate Auth Page in Layout

## Brief

Design how the auth route renders inside the shared `<Layout>` component with a FileHeader-style toolbar that enables users to close the view and return to their prior route without losing state.

## Tasks

- [x] Define auth view component structure: Outline the React component tree for the auth page, including `<Layout>`, header, and existing auth form content.
- [x] Reuse FileHeader styling: Determine how to import or adapt `pkgs/vsc-webview/src/aspects/file/Header.tsx` for the auth top bar, including necessary props and icons.
- [x] Hook header actions to React Router navigation: Specify how the close/back control should invoke `useNavigate` (preferring history back with index fallback).
- [x] Validate layout responsiveness: Check that the auth view respects existing layout constraints, theme, and VS Code webview dimensions.

### Define auth view component structure

Sketch the component composition and identify required props/state for the auth route component, ensuring it slots into the existing layout hierarchy without duplicating providers.

#### Notes

- Implemented `Auth` route in `pkgs/vsc-webview/src/app/Auth.tsx`, wrapping content in `<Layout>` with a two-stage column (`PanelSection` header + body) so the form mirrors the index layout spacing.
- Header includes title/description stack and a close button aligned with FileHeader spacing to keep overall shell consistent.

### Reuse FileHeader styling

Review `Header.tsx` to decide whether to reuse it directly, create a variant, or extract shared styling tokens for the auth header.

#### Notes

- Reused `PanelSection` with the same padding/border treatment as `FileHeader`, pairing it with a `Button` styled `label` control to evoke the FileHeader toolbar without duplicating that component.
- Kept the auth form inside the shared white panel styling provided by `AuthVercel`, preserving typography and spacing.

### Hook header actions to React Router navigation

Plan the event handler wiring so clicking the header control calls a React Router navigation helper (e.g., `navigate(-1)` with a safeguard to `/`), including fallback to the index route when history is empty.

#### Notes

- The header close button and `AuthVercel`'s `onOpenChange` both call the new `goBackOrIndex` helper from `useAppNavigation`, ensuring history-aware back navigation with index fallback.
- `Index.tsx` now routes to `auth` when the error banner `Update` CTA or `auth-panel-open` message fires, replacing the previous local panel toggling logic.

### Validate layout responsiveness

Outline the checks needed to ensure the auth page looks correct across available sizes, including theme variations if relevant.

#### Notes

- Verified the layout keeps the existing flex column/gap rhythm; header & form stack within the default container width so the view adapts to VS Code's narrow pane without overflow.
- `AuthVercel` still manages its own responsive states (summary vs. form) and remains embedded in the same width constraints as the index blueprint.

## Questions

None.

## Notes

Ensure no modal-specific assumptions remain in the auth form code when moved into a dedicated route.

## ADRs

None.
