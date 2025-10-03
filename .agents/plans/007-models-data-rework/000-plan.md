# Models Data Rework

## Brief

Unify models data access by moving Vercel Gateway lookups to the extension/server layer, coordinating models.dev and gateway responses through a dedicated controller, and updating the webview to consume masked secrets, surface key errors, and support recovery flows without exposing sensitive credentials.

## Steps

- [x] [Audit Current Models Data Flow](./001-audit-current-flows.md): Catalogue existing gateway/models.dev fetch paths, message contracts, and caching behaviors to identify migration touchpoints.
- [x] [Build ModelsDataController Backend](./002-models-data-controller.md): Implement an extension-side controller that orchestrates server-side Vercel Gateway requests, models.dev fetches, caching, and fallback/error states.
- [x] [Revise Secret Messaging & Key Status](./003-secret-messaging-update.md): Mask the stored gateway secret in messages, add key status reporting, and coordinate retry/error handling between extension and webview.
- [x] [Refactor Webview Models Context & UI](./004-webview-models-context.md): Introduce a combined models context, disable selectors on gateway failures, and surface retry/update UX aligned with key status messages.
- [x] [Regression Tests & Documentation](./005-qa-and-notes.md): Update automated tests and docs to cover the new data flow, fallback logic, and user-facing behaviors.

### [Audit Current Models Data Flow](./001-audit-current-flows.md)

Inventory how the extension, webview, and gateway wrapper currently interact, including secret storage, `models-dev` caching, SWR hooks, message types, and server endpoints. Note what can be preserved, what must be replaced, and any shared utilities that new code should reuse.

#### Status

Completed – documented extension fetch/caching paths, webview consumers, message contracts, and supporting utilities; no open questions or deferrals.

- [x] Catalogue extension data paths
- [x] Trace webview consumption
- [x] Record message contracts
- [x] Summarize shared utilities

### [Build ModelsDataController Backend](./002-models-data-controller.md)

Create a `ModelsDataController` extending the shared controller base that performs server-side Vercel Gateway lookups with user keys when available, falls back to the wrapper endpoint, normalizes responses, and emits unified models payloads/messages. Ensure the controller handles caching, throttling, and error propagation for both gateway and models.dev requests.

#### Status

Completed – controller now owns gateway/models.dev fetches with TTL caching, unified messaging, and key status propagation; Workbench provider delegates all lookups while maintaining legacy responses.

- [x] Scaffold controller class and lifecycle wiring
- [x] Implement gateway fetch with user/fallback flow
- [x] Consolidate models.dev caching in controller
- [x] Emit models-data/key-status messages
- [x] Integrate controller into provider bootstrap

### [Revise Secret Messaging & Key Status](./003-secret-messaging-update.md)

Adjust extension messaging so the webview receives a masked secret snapshot and key status updates instead of the raw key, add dedicated messages for key fetch success/failure, and wire them into the controller’s fallback/error results to enable retry prompts and state resets.

#### Status

Completed – gateway secrets are now masked/read-only by default, dedicated key status messages report user-scope errors, and the webview secret form reflects saving/retry flows.

- [x] Define masked secret + masking helper
- [x] Update auth messages with masked payload + read-only flags
- [x] Emit key status events from ModelsDataController
- [x] Coordinate retry lifecycle and saving toggles
- [x] Refresh webview secret form for inline errors/saving states

### [Refactor Webview Models Context & UI](./004-webview-models-context.md)

Replace the existing models.dev and gateway hooks with a new context that consumes the unified controller messages, exposes `{ gateway, dotDev }`, manages loading/error states, and drives provider/model pickers with disabled/error UX, retry button, and key update handling consistent with the secret form behavior.

#### Status

Completed – the webview now relies on `useModels` for combined gateway/dotdev data, surfaces banner retry/update controls, and disables selectors when gateway responses fail.

- [x] Scaffold models context provider/hook
- [x] Stream controller responses & key status into context state
- [x] Migrate assessment/blueprint consumers to the new context
- [x] Add gateway error banner with retry/update actions
- [x] Disable selectors & gate models.dev warning on gateway failures
- [x] Synchronise secret form state with masked read-only UX

### [Regression Tests & Documentation](./005-qa-and-notes.md)

Update or add extension/webview unit tests (including messaging bus tests) and integration snapshots to cover the controller, secret masking, error retry flows, and UI changes. Refresh any relevant docs or notes to describe the new data path and recovery steps.

#### Status

Completed – regression coverage now spans controller fallbacks, the new webview context, and documentation/manual QA guidance.

- [x] Extension tests for ModelsDataController fallback + status messaging
- [x] Webview tests updated for context, banner, and disabled selectors
- [x] Shared messaging test expectations refreshed for masked payloads
- [x] Manual QA checklist captured for gateway success/failure flows
- [x] Architecture doc amended with combined models messages

## Questions

### Target Server Layer for Gateway Fetches

Should the user-scoped Vercel Gateway lookup run within the VS Code extension host (acting as the "server" for the webview) or be moved into the existing Cloudflare worker under `pkgs/gateway`? This affects where we instantiate `createGateway`, caching strategy, and how we authenticate requests.

#### Answer

Handle user-scoped lookups within the VS Code extension host so credentials remain local and never traverse our servers; the Cloudflare worker continues to serve only the public fallback endpoint.

## Notes

- Assume existing message strings (`models-dev-*`, `auth-vercel-gateway-*`) may need renaming; confirm during design while preserving backwards compatibility where possible.
- Current SWR-based webview hooks will be replaced; ensure dependent components (e.g., assessment, blueprint) adopt the new context to avoid duplicate fetches.

## Prompt

Plan models data rework.

Currently we have two issues:

- We have to send the Vercel Gateway key to the webview to perform model lookup `getAvailableModels`. It unnecessarily exposes a secret.
- Models.dev request is done in the extension, adding inconsistency between model data source flows.

To fix it, move the Vercel Gateway request to the server. Preserve current logic with alternating between our custom gateway wrapper and direct user-scope request when the key is available.

If the user-scoped Vercel Gateway request fails, fall back to our wrapper data and report a key error. In the webview, subscribe to the key report error and display the error on top of the webview, showing the message from Vercel along with a button to retry. When retried (i.e., after the user updates the key or adds credits to the account), try fetching models again, sending a message to update or remove the error. There should be another button, "Update," that opens the Vercel Gateway secret form. When it's open, display the error inside the form rather than separately.

Instead of sending the Vercel Gateway key, send a masked secret, make the secret field read-only, and unlock it when the user clears the key using the button. After sending the key to the extension, display the secret form as "saving," perform a model lookup, and if it fails, hide the form or display an error. Use a separate extension message for key status; send it after a failed/successful user-scoped fetch. If it fails, display an error using the same logic as if it's hidden (described above), remove disabled from the key, allowing the user to fix it.

Organize model requests (both Vercel Gateway and models.dev) into ModelsDataController inside the extension.

On the webview side, add new context (see pkgs/vsc-webview/src/aspects/settings/Context.tsx for an example of how to organize context with a separate hook). Make the context resolve `{ gateway: ModelGateway.Response | undefined, dotDev: ModelDotdev.Response | undefined }` (see pkgs/model `@wrkspc/model` package for types). The idea of using generic `gateway` rather than `vercel` is that later we will be adding other gateways, so consider that when consuming the gateway response data.

If the gateway (only Vercel for now) response is an error, display provider and model pickers as disabled and show the error message below the selects. If models.dev responds with errors, display a warning below the selects that we can't fetch model capabilities and some settings might be unavailable. If Vercel failed or is not loaded yet, don't display the models.dev warning.

## Follow-Ups

None.
