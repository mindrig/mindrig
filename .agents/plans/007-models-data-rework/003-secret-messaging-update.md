# Revise Secret Messaging & Key Status

## Brief

Update extension↔webview messaging so secrets remain masked, key status is reported via dedicated messages, and UI flows can enable retry and update behaviors without exposing credentials.

## Tasks

- [ ] Define masked secret format: Decide how to represent stored keys and masking logic for outbound messages.
- [ ] Update auth messages: Adjust `auth-vercel-gateway-*` handlers to send masked secrets and read-only flags.
- [ ] Implement key status messaging: Add new message types for success/failure after user-scoped fetch attempts.
- [ ] Coordinate retry lifecycle: Ensure retry requests trigger controller refresh and clear/restore disabled states.
- [ ] Adjust secret form behavior: Update extension responses to toggle saving states and re-enable inputs after errors.

### Define masked secret format

Create a consistent representation for secrets shared with the webview.

- Choose masking strategy (e.g., first/last chars, fixed placeholder length).
- Update secret manager or controller to supply masked string and `hasKey` boolean.
- Document format for webview consumption.

#### Notes

None.

### Update auth messages

Modify message handlers sending secret data to the webview.

- Update `auth-vercel-gateway-state` payload to include masked key, read-only flag, and saving state.
- Ensure clear operations propagate an empty key and unlock the input.
- Remove any remaining direct secret transmissions to the webview.

#### Notes

None.

### Implement key status messaging

Provide dedicated feedback on gateway lookup success/failure.

- Introduce new message type(s) (e.g., `auth-vercel-gateway-status`) with enum/status payload.
- Emit messages after controller fetch attempts, including error messages from Vercel when available.
- Handle success case to clear prior errors and mark key as valid.

#### Notes

None.

### Coordinate retry lifecycle

Ensure retry actions behave consistently across extension and webview.

- Hook retry button messages to controller refresh logic.
- Reset error state when a retry is initiated; re-disable inputs while fetch runs.
- Handle fallback scenarios where wrapper data is used but key error persists.

#### Notes

None.

### Adjust secret form behavior

Align UI state transitions with new messaging protocol.

- Send "saving" signal when key submission occurs; clear once lookup completes.
- On failure, re-enable input and include error message for display.
- Support "Update" command that opens the form with inline error context.

#### Notes

None.

## Questions

None.

## Notes

- Coordinate message type updates with `@wrkspc/vsc-message` to keep typings accurate.

## ADRs

None.
