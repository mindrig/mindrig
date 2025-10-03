# Build ModelsDataController Backend

## Brief

Implement an extension-side controller that centralizes gateway and models.dev requests, manages caching and fallbacks, and exposes unified responses and key status messages to the webview.

## Tasks

- [ ] Scaffold controller: Create `ModelsDataController` with lifecycle hooks and message wiring.
- [ ] Implement gateway fetch flow: Perform user-scoped lookup with fallback to wrapper and error capture.
- [ ] Implement models.dev fetch flow: Consolidate extension fetch, caching, and reuse inside controller.
- [ ] Emit unified messages: Define payloads and send combined `{ gateway, dotDev }` responses plus key status events.
- [ ] Integrate controller: Register within provider/extension bootstrap and remove legacy fetch paths.

### Scaffold controller

Set up the new controller class and interface.

- Extend the shared controller base (`VscController`) or follow existing aspect patterns.
- Define constructor dependencies (secret manager, fetch utilities, message bus).
- Stub public methods for refresh, retry, and message handling.

#### Notes

None.

### Implement gateway fetch flow

Move user-scoped gateway lookups into the controller with fallback behavior.

- Retrieve the user secret via `SecretManager`; if absent, call the public wrapper endpoint.
- When a secret exists, call `createGateway({ apiKey }).getAvailableModels()`.
- On failure, log/report the error, fall back to wrapper data, and prepare key status payload.
- Cache successful responses with TTL to avoid overfetching.

#### Notes

None.

### Implement models.dev fetch flow

Consolidate existing logic for models.dev data inside the controller.

- Reuse `fetch("https://models.dev/api.json")` with caching and error handling.
- Share results across webview requests to avoid redundant network calls.
- Surface errors distinctly so the webview can render warning state independent of gateway status.

#### Notes

None.

### Emit unified messages

Ensure the controller communicates combined model data and key status.

- Define message payloads for `{ gateway, dotDev }` responses leveraging `@wrkspc/model` types.
- Create dedicated key status message for success/error with masked secret metadata.
- Wire fallback logic to send appropriate error messages when gateway requests fail.

#### Notes

None.

### Integrate controller

Hook the controller into extension startup and remove legacy fetch paths.

- Instantiate/register the controller within `WorkbenchViewProvider` (or equivalent host).
- Replace direct `models-dev` message handlers with controller-driven responses.
- Remove webview-bound secret key fetches; ensure new messages cover existing needs.

#### Notes

None.

## Questions

None.

## Notes

- Consider debounce or queueing if multiple webview requests arrive rapidly.

## ADRs

None.
