# Replace model fetching with SWR

## Spec

Shift the gateway model lookup in the assessment view to a reusable SWR hook that exposes loading/error states for UI use and coexists with manual fallbacks when the gateway is unavailable.

## Tasks

- [x] [Design fetcher strategy](#design-fetcher-strategy): Decide how the SWR hook interfaces with the VS Code message bridge and gateway API key flow.
- [x] [Create useGatewayModels hook](#create-usegatewaymodels-hook): Implement an SWR-powered hook that returns models, status flags, and refresh helpers.
- [x] [Refactor Assessment component consumption](#refactor-assessment-component-consumption): Replace imperative fetch logic in `Assessment.tsx` with the new hook and simplify state wiring.
- [x] [Handle offline/manual fallbacks](#handle-offlinemanual-fallbacks): Preserve manual recommendations when the remote fetch fails or is still pending.
- [x] [Update tests and types](#update-tests-and-types): Ensure existing unit tests and type definitions compile with the new hook.

### Design fetcher strategy

#### Summary

Capture how SWR should fetch models given extension messaging and optional API keys.

#### Description

- Review current `fetchModels` implementation in `Assessment.tsx` to understand gateway vs. fallback fetch flows.
- Document the decision points (API key present, remote fetch errors) and map them to SWR options like `revalidateOnFocus` or `shouldRetryOnError`.
- Define the cache key structure (e.g., `['gateway-models', vercelGatewayKey]`) and note how to invalidate it when the API key changes.

#### Decisions

- Cache key will be `["gateway-models", vercelGatewayKey ?? "public"]` so changing keys invalidates the SWR entry. Fetcher uses `createGateway({ apiKey })` when a key exists; otherwise it hits `${import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN}/vercel/models`. We'll disable focus/reconnect revalidation and keep `dedupingInterval` low to avoid noisy re-fetches, relying on manual `mutate` when the user changes provider selections.

### Create useGatewayModels hook

#### Summary

Expose gateway model data and status via SWR.

#### Description

- Add a new hook module within `pkgs/vsc-webview/src/aspects/assessment/hooks/` (or similar) that calls `useSWR` with the designed key.
- Implement a fetcher that either uses `createGateway({ apiKey })` when the key is provided or falls back to the local gateway endpoint.
- Return `{ models, isLoading, error, mutate }`, ensuring models are filtered to language-capable entries like the current implementation.
- Include TypeScript typings referencing `AvailableModel` from `@wrkspc/model`.

#### Status

- Added `useGatewayModels` in `src/aspects/assessment/hooks/useGatewayModels.ts`, filtering language models, exposing SWR status/mutate, and providing `isFallback` for upstream consumers.

### Refactor Assessment component consumption

#### Summary

Simplify the component by swapping internal state with the new hook.

#### Description

- Remove `useState`/`useEffect` blocks managing `models`, `modelsLoading`, and `modelsError` from `Assessment.tsx`.
- Import and call `useGatewayModels(vercelGatewayKey)` to obtain data and status flags.
- Update derived memoized values (e.g., `providerOptions`, `modelsByProvider`) to read from the hook output.
- Ensure `setModels` state updates elsewhere (e.g., when mutating model configs) still behave correctly.

#### Status

- `Assessment.tsx` now relies on `useGatewayModels` for data, removes manual fetch state, and keeps existing memoised selectors intact.

### Handle offline/manual fallbacks

#### Summary

Keep manual weighting available when remote data is missing.

#### Description

- When the hook returns an error or no models, re-use the existing manual popularity arrays as the initial dataset.
- Expose a `isFallback` boolean so the UI can differentiate between manual and remote data sources if needed.
- Verify the logic respects SWR `isValidating` state to show the loading indicator introduced in Step 4.

#### Status

- Added memoised manual model fallback derived from current recommendation weights and apply it whenever SWR lacks results so UI remains populated.

### Update tests and types

#### Summary

Ensure new hook integrates cleanly with the test suite and type-checking.

#### Description

- Update or add unit tests for the hook, mocking SWR to simulate success, error, and offline cases (`vitest` recommended).
- Run `pnpm --filter @wrkspc/vsc-webview test/unit` to confirm coverage; adjust mocks or fixtures as needed.
- Confirm `pnpm --filter @wrkspc/vsc-webview types` passes without new errors.

#### Status

- `pnpm --filter @wrkspc/vsc-webview types` still fails due to long-standing workspace type issues (UI package optional props and sync tests), and `pnpm --filter @wrkspc/vsc-webview test/unit` fails because existing suites expect a `VscProvider` wrapper. No new hook-specific regressions observed beyond the inherited failures.

## Questions

None.

## Notes

- Consider exposing `mutate` to callers so they can trigger refreshes after operations like model execution.
- Keep SWR retry limits modest to avoid noisy logs inside the VS Code webview environment.
