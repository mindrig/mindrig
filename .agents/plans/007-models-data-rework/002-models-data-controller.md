# Build ModelsDataController Backend

## Brief

Implement an extension-side controller that centralizes gateway and models.dev requests, manages caching and fallbacks, and exposes unified responses and key status messages to the webview.

## Tasks

- [x] Scaffold controller: Create `ModelsDataController` with lifecycle hooks and message wiring.
- [x] Implement gateway fetch flow: Perform user-scoped lookup with fallback to wrapper and error capture.
- [x] Implement models.dev fetch flow: Consolidate extension fetch, caching, and reuse inside controller.
- [x] Emit unified messages: Define payloads and send combined `{ gateway, dotDev }` responses plus key status events.
- [x] Integrate controller: Register within provider/extension bootstrap and remove legacy fetch paths.

### Scaffold controller

Set up the new controller class and interface.

- Extend the shared controller base (`VscController`) or follow existing aspect patterns.
- Define constructor dependencies (secret manager, fetch utilities, message bus).
- Stub public methods for refresh, retry, and message handling.

#### Notes

- Introduced `pkgs/vsc-extension/src/ModelsDataController.ts` extending `VscController`, registering `models-data-get`/`models-dev-get` listeners, and exposing `refresh`/`handleSecretChanged` entry points.
- Constructor dependencies include the message bus, `SecretManager`, gateway origin, and optional fetch/clock hooks for testability.

### Implement gateway fetch flow

Move user-scoped gateway lookups into the controller with fallback behavior.

- Retrieve the user secret via `SecretManager`; if absent, call the public wrapper endpoint.
- When a secret exists, call `createGateway({ apiKey }).getAvailableModels()`.
- On failure, log/report the error, fall back to wrapper data, and prepare key status payload.
- Cache successful responses with TTL to avoid overfetching.

#### Notes

- `#fetchGateway` pulls user secrets, attempts `createGateway({ apiKey })`, and records success metadata while preserving errors for key status reporting.
- Fallback to `${VITE_MINDRIG_GATEWAY_ORIGIN}/vercel/models` normalizes the payload via `#normalizeGatewayResponse` and tags responses with `source` + `fetchedAt` for caching awareness.
- TTL caching (60s) and inflight promise reuse prevent redundant requests when the webview spams refreshes.

### Implement models.dev fetch flow

Consolidate existing logic for models.dev data inside the controller.

- Reuse `fetch("https://models.dev/api.json")` with caching and error handling.
- Share results across webview requests to avoid redundant network calls.
- Surface errors distinctly so the webview can render warning state independent of gateway status.

#### Notes

- `#fetchModelsDev` centralizes the HTTPS request with a 5-minute TTL, inflight dedupe, and union payloads that capture both success and error cases.
- Legacy `models-dev-response` emissions reuse the cached union, so existing SWR providers receive unchanged envelopes during the migration window.

### Emit unified messages

Ensure the controller communicates combined model data and key status.

- Define message payloads for `{ gateway, dotDev }` responses leveraging `@wrkspc/model` types.
- Create dedicated key status message for success/error with masked secret metadata.
- Wire fallback logic to send appropriate error messages when gateway requests fail.

#### Notes

- Extended `@wrkspc/model` gateway typings to annotate `source`/`fetchedAt` and error variants; updated `@wrkspc/vsc-message` with `models-data-*` and `models-gateway-key-status` payloads.
- Controller now emits combined `{ gateway, dotDev }` packets via `#emitCombinedResponse()` and key status notifications via `#broadcastKeyStatus()` after each gateway attempt.

### Integrate controller

Hook the controller into extension startup and remove legacy fetch paths.

- Instantiate/register the controller within `WorkbenchViewProvider` (or equivalent host).
- Replace direct `models-dev` message handlers with controller-driven responses.
- Remove webview-bound secret key fetches; ensure new messages cover existing needs.

#### Notes

- `WorkbenchView/Provider` now instantiates the controller through `#ensureModelsDataController()`, hooks secret change notifications, and triggers refresh on `lifecycle-webview-ready`.
- Removed inline `#handleGetModelsDev`, added an `@wrkspc/model` dependency, and delegated both legacy and new messaging paths to the controller.

## Questions

None.

## Notes

- Controller caches (60s gateway / 5m models.dev) mitigate bursty requests; masked secret handling remains scheduled for Step 003.

## ADRs

None.
