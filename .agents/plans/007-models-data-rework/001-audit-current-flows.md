# Audit Current Models Data Flow

## Brief

Document how gateway and models.dev data currently move between the extension, webview, and Cloudflare worker so we can target precise refactors without breaking existing behaviors or exposing secrets.

## Tasks

- [ ] Catalogue extension data paths: Inventory gateway/models.dev fetch sites, secret usage, and caching.
- [ ] Trace webview consumption: Map hooks, contexts, and UI components that rely on models data.
- [ ] Record message contracts: Capture extension↔webview message types carrying models or secrets.
- [ ] Summarize shared utilities: Note helper modules and config (env vars, SWR keys) that influence requests.

### Catalogue extension data paths

Detail every extension-side implementation touching model data to understand migration impact.

- Search `pkgs/vsc-extension` for gateway/model fetch logic (e.g., `createGateway`, `models-dev`).
- Note which classes handle secrets (`SecretManager`) and how they feed fetches.
- Record caching or retry logic tied to current requests.

#### Notes

None.

### Trace webview consumption

Identify all webview sites that consume gateway/models.dev results.

- Inspect SWR hooks (`useGatewayModels`, models.dev context) and their consumers in assessment/blueprint UI.
- Document derived states (loading, fallback flags) that new context must preserve.
- Capture dependencies on environment variables or global contexts.

#### Notes

None.

### Record message contracts

Capture existing VS Code messages that shuttle secrets or model data.

- List `auth-vercel-gateway-*`, `models-dev-*`, and related message handlers with payload shapes.
- Identify where messages are registered via `VscMessageBus` for reuse in controller work.
- Highlight any implicit assumptions (e.g., raw key presence) to replace with masked data.

#### Notes

None.

### Summarize shared utilities

Document helpers/config that affect model fetches for reuse or refactor planning.

- Review `@wrkspc/model` exports, gateway package endpoints, and environment variable declarations.
- Track how the webview fallback gateway URL is assembled for parity with extension logic.
- Note any test fixtures or mocks that rely on the current structure.

#### Notes

None.

## Questions

None.

## Notes

None.

## ADRs

None.
