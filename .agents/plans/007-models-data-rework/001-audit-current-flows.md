# Audit Current Models Data Flow

## Brief

Document how gateway and models.dev data currently move between the extension, webview, and Cloudflare worker so we can target precise refactors without breaking existing behaviors or exposing secrets.

## Tasks

- [x] Catalogue extension data paths: Inventory gateway/models.dev fetch sites, secret usage, and caching.
- [x] Trace webview consumption: Map hooks, contexts, and UI components that rely on models data.
- [x] Record message contracts: Capture extension↔webview message types carrying models or secrets.
- [x] Summarize shared utilities: Note helper modules and config (env vars, SWR keys) that influence requests.

### Catalogue extension data paths

Detail every extension-side implementation touching model data to understand migration impact.

- Search `pkgs/vsc-extension` for gateway/model fetch logic (e.g., `createGateway`, `models-dev`).
- Note which classes handle secrets (`SecretManager`) and how they feed fetches.
- Record caching or retry logic tied to current requests.

#### Notes

- `pkgs/vsc-extension/src/WorkbenchView/Provider.ts` keeps models.dev lookups entirely inside the extension via `#handleGetModelsDev()`, caching the JSON in `#modelsDevCache` and returning `ModelsDevResponseMessage` success/error payloads.
- The same provider owns the `SecretManager` life cycle: `#initializeSecretManager()` publishes raw gateway secrets over `auth-vercel-gateway-state`, while `#sendVercelGatewayKey()`, `#handleSetVercelGatewayKey()`, and `#handleClearVercelGatewayKey()` expose asynchronous get/set/clear flows.
- Prompt execution still depends on `AIService` (`pkgs/vsc-extension/src/AIService.ts`) which instantiates `createGateway({ apiKey })`; this is the only extension site that currently consumes the stored key.
- There is no existing controller abstraction—gateway/model fetch responsibilities live directly on `WorkbenchView.Provider` and the webview is still responsible for gateway model discovery.

### Trace webview consumption

Identify all webview sites that consume gateway/models.dev results.

- Inspect SWR hooks (`useGatewayModels`, models.dev context) and their consumers in assessment/blueprint UI.
- Document derived states (loading, fallback flags) that new context must preserve.
- Capture dependencies on environment variables or global contexts.

#### Notes

- `pkgs/vsc-webview/src/app/Context.tsx` wraps the entire UI with `ModelsDevProvider`, binding the message bus request/response lifecycle for models.dev, managing SWR caching, and persisting data through `setModelsDevData`.
- `ModelsDevProvider` listens to `models-dev-response`, triggers `models-dev-get`, falls back to a direct `fetch(modelsDotdevUrl())` when the extension request fails, and exposes an error/loading surface via SWR.
- `useGatewayModels` (`pkgs/vsc-webview/src/aspects/assessment/hooks/useGatewayModels.ts`) performs gateway model fetches in the webview: it instantiates `createGateway({ apiKey })` when a user key is present and otherwise fetches from the Cloudflare worker at `${VITE_MINDRIG_GATEWAY_ORIGIN}/vercel/models`.
- `Index.tsx` tracks the raw `vercelGatewayKey` with `useState`, surfaces it to both `AuthVercel` and downstream assessment/blueprint flows, and subscribes directly to `auth-vercel-gateway-state` to update local state.
- UI consumption is centralized in `Assessment.tsx` and `Blueprint.tsx`, which read `useGatewayModels` and `useModelsDev` data to populate provider/model pickers, fallback recommendations, and capability warnings.

### Record message contracts

Capture existing VS Code messages that shuttle secrets or model data.

- List `auth-vercel-gateway-*`, `models-dev-*`, and related message handlers with payload shapes.
- Identify where messages are registered via `VscMessageBus` for reuse in controller work.
- Highlight any implicit assumptions (e.g., raw key presence) to replace with masked data.

#### Notes

- `pkgs/vsc-message/src/message/models.ts` defines the `models-dev-get` request and `models-dev-response` envelope that toggles between `{ status: "ok", data }` and `{ status: "error", error }` payloads.
- `pkgs/vsc-message/src/message/auth.ts` exposes `auth-vercel-gateway-get/set/clear/state` events; the `state` payload currently includes the raw `vercelGatewayKey` string.
- `WorkbenchView.Provider` wires these contracts into the `VscMessageBus`, registering listeners for `models-dev-get` and the auth trio, and re-emitting `auth-vercel-gateway-state` both immediately on demand (`#sendVercelGatewayKey`) and reactively from `SecretManager` changes.
- The webview subscribes through `useMessage`/`useOn`, dispatching `models-dev-get`, `auth-vercel-gateway-set`, and `auth-vercel-gateway-clear` from UI actions in `Index.tsx` and `AuthVercel`, while listening for `auth-vercel-gateway-state` to hydrate its local key state.

### Summarize shared utilities

Document helpers/config that affect model fetches for reuse or refactor planning.

- Review `@wrkspc/model` exports, gateway package endpoints, and environment variable declarations.
- Track how the webview fallback gateway URL is assembled for parity with extension logic.
- Note any test fixtures or mocks that rely on the current structure.

#### Notes

- The `@wrkspc/model` package exposes `ModelDotdev` typings plus helpers such as `modelsDotdevUrl()`, `setModelsDevData`, and `getModelCapabilities`, all of which the webview uses to derive provider lists and capability flags (`pkgs/model/src/dotdev.ts`).
- Gateway fallbacks route through the Cloudflare worker in `pkgs/gateway/src/index.ts`, which proxies `/vercel/models` using the worker-scoped `VERCEL_GATEWAY_KEY` and `createGateway({ apiKey })`.
- Webview and extension rely on `import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN` to build the fallback fetch URL and CSP connect-src allowances (`pkgs/vsc-webview/src/aspects/assessment/hooks/useGatewayModels.ts`, `pkgs/vsc-extension/src/WorkbenchView/Provider.ts`).
- Tests under `pkgs/vsc-webview/src/__tests__` mock `useGatewayModels`/`useModelsDev`, so updated APIs will require fixture refresh once the controller/context changes land.

## Questions

None.

## Notes

Extension/webview data audit complete: we catalogued models.dev caching, webview SWR consumers, message contracts, and shared helpers with no outstanding follow-ups.

## ADRs

None.
