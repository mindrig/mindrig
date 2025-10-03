# Revise Secret Messaging & Key Status

## Brief

Update extension↔webview messaging so secrets remain masked, key status is reported via dedicated messages, and UI flows can enable retry and update behaviors without exposing credentials.

## Tasks

- [x] Define masked secret format: Decide how to represent stored keys and masking logic for outbound messages.
- [x] Update auth messages: Adjust `auth-vercel-gateway-*` handlers to send masked secrets and read-only flags.
- [x] Implement key status messaging: Add new message types for success/failure after user-scoped fetch attempts.
- [x] Coordinate retry lifecycle: Ensure retry requests trigger controller refresh and clear/restore disabled states.
- [x] Adjust secret form behavior: Update extension responses to toggle saving states and re-enable inputs after errors.

### Define masked secret format

Create a consistent representation for secrets shared with the webview.

- Choose masking strategy (e.g., first/last chars, fixed placeholder length).
- Update secret manager or controller to supply masked string and `hasKey` boolean.
- Document format for webview consumption.

#### Notes

- Added `WorkbenchView.Provider.#maskSecret` to standardize masking (`prefix...suffix`), ensuring no raw key ever leaves the extension (`pkgs/vsc-extension/src/WorkbenchView/Provider.ts`).


### Update auth messages

Modify message handlers sending secret data to the webview.

- Update `auth-vercel-gateway-state` payload to include masked key, read-only flag, and saving state.
- Ensure clear operations propagate an empty key and unlock the input.
- Remove any remaining direct secret transmissions to the webview.

#### Notes

- Reworked `auth-vercel-gateway-state` payload to `{ maskedKey, hasKey, readOnly, isSaving }` and introduced `auth-vercel-gateway-status` in `@wrkspc/vsc-message` (`pkgs/vsc-message/src/message/auth.ts`).
- Provider now publishes gateway state via `#publishGatewayState`, toggling read-only + saving flags while storing secrets (`pkgs/vsc-extension/src/WorkbenchView/Provider.ts`).


### Implement key status messaging

Provide dedicated feedback on gateway lookup success/failure.

- Introduce new message type(s) (e.g., `auth-vercel-gateway-status`) with enum/status payload.
- Emit messages after controller fetch attempts, including error messages from Vercel when available.
- Handle success case to clear prior errors and mark key as valid.

#### Notes

- `ModelsDataController` now tracks user attempts/fallbacks, broadcasting `auth-vercel-gateway-status` with `status`, `message`, `source`, `fallbackUsed`, and `userAttempted` metadata (`pkgs/vsc-extension/src/ModelsDataController.ts`).
- Provider consults `getLastGatewayStatus()` when secrets change to decide whether to unlock the form after failures (`pkgs/vsc-extension/src/WorkbenchView/Provider.ts`).


### Coordinate retry lifecycle

Ensure retry actions behave consistently across extension and webview.

- Hook retry button messages to controller refresh logic.
- Reset error state when a retry is initiated; re-disable inputs while fetch runs.
- Handle fallback scenarios where wrapper data is used but key error persists.

#### Notes

- Secret set/clear flows set `#gatewaySaving` and reissue state snapshots before/after controller refresh, guaranteeing the webview sees disabled inputs while fetches run (`pkgs/vsc-extension/src/WorkbenchView/Provider.ts`).
- Gateway status events cover fallback/error outcomes so retries simply trigger `models-data-get` (already handled by the controller) without extra wiring.


### Adjust secret form behavior

Align UI state transitions with new messaging protocol.

- Send "saving" signal when key submission occurs; clear once lookup completes.
- On failure, re-enable input and include error message for display.
- Support "Update" command that opens the form with inline error context.

#### Notes

- Webview `AuthVercel` presents a masked summary view with "Update" + "Clear" actions, opens editable forms on errors, and shows inline validation tied to `isSaving`/`errorMessage` props (`pkgs/vsc-webview/src/aspects/auth/Vercel.tsx`).
- `Index.tsx` maintains derived gateway secret/status state, passing masked data to the form while withholding the raw key from downstream components (`pkgs/vsc-webview/src/app/Index.tsx`).

## Questions

None.

## Notes

- Top-level gateway error banner will be wired through the new models context in Step 004; current changes focus on secret panel UX and backend messaging.

## ADRs

None.
