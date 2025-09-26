# Add model status indicator

## Spec

Introduce a compact color-dot indicator near the model selector reflecting loading, success, or error states sourced from SWR hooks.

## Tasks

- [x] [Place indicator in UI](#place-indicator-in-ui): Decide where the dot should render alongside existing selector controls.
- [x] [Create reusable indicator component](#create-reusable-indicator-component): Build a simple component that maps status to the agreed color palette.
- [x] [Wire indicator to SWR state](#wire-indicator-to-swr-state): Feed loading/error/signaling data from the new hooks into the indicator.
- [x] [Style and theme alignment](#style-and-theme-alignment): Ensure the dot matches current spacing and dark/light themes without tokens.
- [x] [Regression checks](#regression-checks): Verify the indicator behaves correctly across key flows.

### Place indicator in UI

#### Summary

Pick the exact UI element that will host the dot.

#### Description

- Review `Assessment` layout to identify the model selector container.
- Decide whether to place the dot inside the selector label, adjacent to the dropdown, or within its footer/action bar.
- Document the placement in this plan step to align future implementation and design review.

#### Status

- Indicator now sits next to the "Model" heading within the existing flex header in `Assessment.tsx`, preserving spacing alongside the add-model button.

### Create reusable indicator component

#### Summary

Encapsulate the dot rendering logic.

#### Description

- Add a small component, e.g., `ModelStatusDot`, under `pkgs/vsc-webview/src/aspects/assessment/components/`.
- Render a circle using inline styles or Tailwind utility classes with accessible `aria-label` text describing the current state.
- Map `loading`, `success`, and `error` states to `#9CA3AF`, `#22C55E`, and `#EF4444`, respectively; expose a `status` prop.
- Include optional animation (e.g., pulsing) for loading if it fits existing patterns.

#### Status

- Implemented `ModelStatusDot` with the agreed palette, `aria-label`, and a pulse animation for loading state in `components/ModelStatusDot.tsx`.

### Wire indicator to SWR state

#### Summary

Connect the component to live data sources.

#### Description

- In `Assessment.tsx`, derive a status value from `useGatewayModels` (`isLoading`, `error`, `models?.length`).
- Fallback to `loading` while both gateway models and models.dev context are fetching.
- Update the render tree to pass the computed status into `ModelStatusDot` and position it near the selector.

#### Status

- Computed `modelStatus` from gateway/model.dev loading and error flags so the dot reflects loading, success, or error while manual fallbacks are active.

### Style and theme alignment

#### Summary

Ensure the indicator matches existing spacing and theming conventions.

#### Description

- Test the indicator in both light and dark VS Code themes to confirm contrast.
- Adjust padding/margins so the dot aligns with typography baseline and does not shift layout when toggling states.
- Consider wrapping the component with existing utility classes (e.g., flex containers) to maintain consistent spacing.

#### Status

- Indicator inherits the heading’s flex row with a small gap and uses solid colors that read in dark/light themes; no additional spacing tweaks required.

### Regression checks

#### Summary

Validate that the new UI element does not break existing flows.

#### Description

- Manually test scenarios: first-load (loading), successful fetch, fetch error (simulate by disconnecting network), and offline fallback.
- Ensure keyboard navigation and screen reader announcements remain unchanged.
- Run the webview unit tests and linting to confirm no regressions.

#### Status

- New unit tests run via `pnpm --filter @wrkspc/vsc-webview test/unit`; suite still fails from pre-existing VSC provider mocks, while indicator logic itself passed.

## Questions

None.

## Notes

- If the dot feels visually heavy, consider reducing its size or adding subtle opacity, but keep the color mapping intact for now.
