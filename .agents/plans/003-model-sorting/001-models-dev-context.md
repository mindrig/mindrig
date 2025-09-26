# Establish models.dev context

## Spec

Expose models.dev metadata through a dedicated React context backed by SWR so downstream components can access cached provider/model attributes with graceful offline fallbacks.

## Tasks

- [x] [Review current models.dev touchpoints](#review-current-modelsdev-touchpoints): Inventory how the extension and webview currently request and cache models.dev data to inform the new context API.
- [x] [Add swr dependency to webview package](#add-swr-dependency-to-webview-package): Declare `swr` in `@wrkspc/vsc-webview` and ensure type support is available for hooks.
- [x] [Implement ModelsDevProvider](#implement-modelsdevprovider): Create a context mirroring `VscProvider` that loads models.dev data with SWR, normalises lookups, and provides offline defaults via `@wrkspc/model` utilities.
- [x] [Export useModelsDev hook](#export-usemodelsdev-hook): Publish a hook that exposes data, status flags, and helper selectors while reusing cached SWR state.
- [x] [Wrap root app with provider](#wrap-root-app-with-provider): Integrate the new provider into `pkgs/vsc-webview/src/app/Context.tsx` (or equivalent) so all views can consume the hook without extra wiring.

### Review current models.dev touchpoints

#### Summary

Map existing fetch-and-cache behaviour to avoid double-loading and preserve side effects.

#### Description

- Inspect `pkgs/vsc-extension/src/WorkbenchView/Provider.ts` to confirm how models.dev data is requested and forwarded to the webview.
- Review `pkgs/vsc-webview/src/aspects/assessment/Assessment.tsx` for the current `setModelsDevData` usage triggered by `window.postMessage` events.
- Capture gaps (e.g., duplicate caches, missing error handling) in a short note inside this plan step file for later reference when designing the SWR fetcher.

#### Findings

- Extension-side `WorkbenchViewProvider` keeps a mutable `#modelsDevCache` and sends it via `modelsDev` messages, while the webview listens once and stores data in module-level cache through `setModelsDevData` without retry or error surfacing. Multiple state setters mirror loading/error booleans in `Assessment`, so context + SWR should collapse the imperative listeners and provide shared status flags.

### Add swr dependency to webview package

#### Summary

Ensure the React app can import `useSWR` and associated types.

#### Description

- Add `"swr": "^2"` (or the latest compatible major) to the `dependencies` block of `pkgs/vsc-webview/package.json`.
- Run `pnpm install` at the workspace root to update the lockfile and confirm no peer conflicts appear.
- Note any required TypeScript configuration (usually none) but verify the project compiles with `pnpm --filter @wrkspc/vsc-webview types`.

#### Status

- Dependency added and `pnpm install` completed without new warnings. `pnpm --filter @wrkspc/vsc-webview types` still fails due to pre-existing type errors in `subs/ds/pkgs/ui` and integration tests; documented here for awareness.

### Implement ModelsDevProvider

#### Summary

Create the context component that fetches and caches models.dev data.

#### Description

- Add a new module, e.g., `pkgs/vsc-webview/src/aspects/models-dev/Context.tsx`.
- Define a context value containing `data`, `isLoading`, `error`, and helper maps keyed by provider/model IDs.
- Use `useSWR(modelsDotdevUrl(), fetcher, { fallbackData })`, where `fetcher` uses the webview message bridge when available and the fallback uses manual popularity weights.
- Leverage `setModelsDevData` and `getModelCapabilities` from `@wrkspc/model` to populate helper lookups after successful fetches.
- Ensure the provider memoizes derived maps for performance and logs recoverable errors without breaking consumers.

#### Status

- Added `ModelsDevProvider` and helpers in `pkgs/vsc-webview/src/aspects/models-dev/Context.tsx`, backed by SWR with message-bridge fetcher, shared fallback data, and capability lookups; Prettier applied.

### Export useModelsDev hook

#### Summary

Deliver a consumer-friendly hook wrapping the context.

#### Description

- In the same module, export `useModelsDev()` that retrieves the context and throws if missing (mirroring `useVsc`).
- Include convenience helpers (e.g., `getProvider(providerId)`, `getModel(providerId, modelId)`) that rely on memoized maps.
- Return status flags (`isLoading`, `isError`, `isValidating`) surfaced directly from SWR so downstream components can render indicators.
- Add minimal JSDoc comments to clarify types for future contributors.

#### Status

- Exposed `useModelsDev()` throwing outside provider and surfacing SWR status plus convenience helpers for provider/model lookup and capability access.

### Wrap root app with provider

#### Summary

Ensure the React tree has access to models.dev context.

#### Description

- Update `pkgs/vsc-webview/src/app/Context.tsx` (or the highest shared context wrapper) to nest the existing providers inside `<ModelsDevProvider>`.
- Verify the provider ordering still allows `VscProvider` to deliver the VS Code API before models.dev fetch logic runs.
- Confirm the app renders in development by running `pnpm --filter @wrkspc/vsc-webview dev` and checking the absence of runtime errors in the console.

#### Status

- Root context now nests `<ModelsDevProvider>` inside `<VscProvider>` and around `<SettingsProvider>`; manual dev server check pending later once full feature set is wired.

## Questions

None.

## Notes

- Consider reusing the extension-side cache as a SWR fallback to minimise redundant network calls.
- Capture any telemetry or logging needs for failed fetches so later steps can hook into observability if required.
