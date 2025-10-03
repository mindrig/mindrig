# Refactor Webview Models Context & UI

## Brief

Introduce a unified models context in the webview that consumes extension messages, exposes `{ gateway, dotDev }`, and updates UI components with error, disabled, and retry flows aligned with masked secret handling.

## Tasks

- [x] Scaffold models context: Create provider/hook structure mirroring settings context.
- [x] Consume controller messages: Subscribe to new models/key status messages and manage state.
- [x] Update consumers: Refactor assessment, blueprint, and related components to use new context.
- [x] Implement error UI: Display top-level gateway errors with retry/update buttons and inline form messaging.
- [x] Adjust selectors and warnings: Disable provider/model pickers on gateway errors and show models.dev warning logic.
- [x] Update secret form integration: Make field read-only, show saving state, and handle inline errors when open.

### Scaffold models context

Lay the groundwork for the new context module.

- Create `pkgs/vsc-webview/src/aspects/models/Context.tsx` (or similar) following existing context pattern.
- Define context value `{ gateway, dotDev, isLoading, error, retry }` and hook for consumption.
- Ensure provider integrates with app `Context.tsx` root composition.

#### Notes

- Added `pkgs/vsc-webview/src/aspects/models/Context.tsx` exposing `ModelsProvider`/`useModels` with unified `{ gateway, dotDev, keyStatus, retry }` state.


### Consume controller messages

Wire the context to listen for combined responses and key status events.

- Use `useMessage().listen` to subscribe to `{ gateway, dotDev }` and key status messages.
- Manage local state for loading, cached results, and current key error (message + severity).
- Trigger controller refresh (via message) for retries and when key status changes to success.

#### Notes

- Context listens for `models-data-response` and `auth-vercel-gateway-status`, normalises fallback data, and calls `setModelsDevData` for capability helpers (`pkgs/vsc-webview/src/aspects/models/Context.tsx`).


### Update consumers

Refactor downstream components to rely on the new context.

- Replace `useGatewayModels` and models.dev SWR usage in assessment/blueprint with context selectors.
- Update type imports to use `ModelGateway.Response` and `ModelDotdev.Response` data.
- Remove redundant fetch logic or fallback handling now managed by the context.

#### Notes

- Root app now wraps children with `ModelsProvider` instead of the legacy SWR provider (`pkgs/vsc-webview/src/app/Context.tsx`).
- `Assessment.tsx` and `Index.tsx` consume `useModels`, dropping `useGatewayModels`/`useModelsDev`; tests updated to mock the new hook.


### Implement error UI

Enhance the UI to surface key errors and retry/update actions.

- Display gateway error banner atop the webview when not in secret form; include Retry and Update buttons.
- Wire Retry to context retry handler; wire Update to open secret form and show inline error.
- Hide banner when form is open, but render error inside the form body.

#### Notes

- `Index.tsx` shows a red banner when `keyStatus.status === "error"`, wiring `Retry` to `models-data-get` and `Update` to open the secret form; errors now flow inline into `AuthVercel`.


### Adjust selectors and warnings

Apply gateway error state to disable model picking and coordinate models.dev warnings.

- Disable provider/model selects when gateway data is error or loading.
- Show models.dev warning only when gateway succeeded and dotDev failed.
- Ensure fallback data from wrapper still enables selects if gateway error is resolved.

#### Notes

- Provider/model selects consult context state: disables when `gateway.response.status === "error"` and suppresses models.dev warning while gateway unavailable (`pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx`).


### Update secret form integration

Align secret input behavior with new read-only and saving requirements.

- Make input read-only when key exists; unlock once user clears key.
- Reflect saving state (spinner/disabled) after key submission until status message arrives.
- Display inline error message when controller reports key failure while form is open.

#### Notes

- Secret form tracks open state via `onOpenChange`, honours read-only masking, and hides the banner while expanded (`pkgs/vsc-webview/src/aspects/auth/Vercel.tsx`, `pkgs/vsc-webview/src/app/Index.tsx`).

## Questions

None.

## Notes

- Coordinated banner/button styling with existing DS primitives; legacy `useModelsDev` now proxies the new context and can be removed once external imports migrate.

## ADRs

None.
