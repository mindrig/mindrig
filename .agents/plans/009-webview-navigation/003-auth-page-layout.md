# Integrate Auth Page in Layout

## Brief

Design how the auth route renders inside the shared `<Layout>` component with a FileHeader-style toolbar that enables users to close the view and return to their prior route without losing state.

## Tasks

- [ ] Define auth view component structure: Outline the React component tree for the auth page, including `<Layout>`, header, and existing auth form content.
- [ ] Reuse FileHeader styling: Determine how to import or adapt `pkgs/vsc-webview/src/aspects/file/Header.tsx` for the auth top bar, including necessary props and icons.
- [ ] Hook header actions to navigation helpers: Specify how the close/back control should invoke the history-aware navigation function.
- [ ] Validate layout responsiveness: Check that the auth view respects existing layout constraints, theme, and VS Code webview dimensions.

### Define auth view component structure

Sketch the component composition and identify required props/state for the auth route component, ensuring it slots into the existing layout hierarchy without duplicating providers.

#### Notes

Capture expected JSX structure for reference during implementation.

### Reuse FileHeader styling

Review `Header.tsx` to decide whether to reuse it directly, create a variant, or extract shared styling tokens for the auth header.

#### Notes

Document any modifications needed so later execution can implement them quickly.

### Hook header actions to navigation helpers

Plan the event handler wiring so clicking the header control calls the `navigateBack` helper, including fallback to index when history is empty.

#### Notes

Note any additional telemetry or analytics events to fire on close, if applicable.

### Validate layout responsiveness

Outline the checks needed to ensure the auth page looks correct across available sizes, including theme variations if relevant.

#### Notes

Point out any responsive breakpoints or CSS adjustments that might be required during execution.

## Questions

None.

## Notes

Ensure no modal-specific assumptions remain in the auth form code when moved into a dedicated route.

## ADRs

None.
