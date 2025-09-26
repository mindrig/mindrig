# Rework model sorting and recommendations

## Spec

Combine SWR-fed models.dev metadata with existing recommendation weights to sort models by recency first, then curated scores, while keeping provider ordering intact.

## Tasks

- [x] [Determine latest-model detection](#determine-latest-model-detection): Identify which models within each provider count as "latest" using models.dev `last_updated` values.
- [x] [Map recommendation weights to models.dev IDs](#map-recommendation-weights-to-modelsdev-ids): Align curated recommendation scores with models.dev identifiers for the expanded provider list.
- [x] [Rewrite provider grouping logic](#rewrite-provider-grouping-logic): Update `Assessment` utilities to build provider-model groupings using the new metadata.
- [x] [Implement combined sorting comparator](#implement-combined-sorting-comparator): Sort models by recency with recommendation tie-breakers and name fallback.
- [x] [Validate against sample datasets](#validate-against-sample-datasets): Smoke-test the sorting algorithm with mocked SWR outputs to ensure offline fallbacks behave correctly.

### Determine latest-model detection

#### Summary

Clarify how to decide which models qualify as the provider's latest for recommendation boosting.

#### Description

- Using the models.dev context, build a helper that collects each provider's models sorted by `last_updated`.
- Mark the top one or two entries per provider (depending on data availability) as "latest" for recommendation purposes.
- Document any providers lacking `last_updated` metadata and specify how to fall back (e.g., use release date or existing manual ordering).

#### Status

- Added timestamp parsing and the `computeRecommendationWeightsForProvider` helper in `modelSorting.ts`, letting us derive recency lists from models.dev data and downgrade to manual ordering whenever timestamps are missing or the context falls back.

### Map recommendation weights to models.dev IDs

#### Summary

Align curated scores with the expanded provider roster.

#### Description

- Extend the manual `MODEL_POPULARITY` structure (or create a successor) to include Microsoft and xAI alongside the existing providers.
- Ensure keys match the normalised IDs returned by models.dev (e.g., `microsoft`, `xai`).
- Apply recommendation weights only to the latest models flagged in the previous task; set others to lower defaults.
- Retain fallback weights for offline mode, matching the current behaviour for providers not in the popular list.

#### Status

- Centralised provider popularity and offline weights in `modelSorting.ts`, expanding the roster to Microsoft and xAI and issuing dynamic scores only to the newest models while reusing manual weights for offline mode.

### Rewrite provider grouping logic

#### Summary

Refactor grouping to pull metadata from the context rather than hardcoded tables.

#### Description

- Update `modelsByProvider` computation in `Assessment.tsx` (or extracted helper) to read `last_updated` and display names from models.dev data when available.
- Ensure the grouping retains provider popularity ordering by referencing `PROVIDER_POPULARITY` untouched.
- Cache derived provider-model arrays with `useMemo` to prevent unnecessary recomputations.

#### Status

- `Assessment.tsx` now pulls models.dev names/timestamps via `useModelsDev`, builds recommendation scores, and sorts provider buckets with the shared comparator while keeping provider popularity ordering intact.

### Implement combined sorting comparator

#### Summary

Create a deterministic sort function that respects recency and recommendations.

#### Description

- Write a comparator that first compares `last_updated` timestamps (descending), then recommendation weight (descending), then locale-aware string comparison on model names/IDs.
- When `last_updated` is missing, treat the value as `0` (oldest) but still allow recommendation scores to differentiate.
- Reuse this comparator for both provider-level model lists and any global model selectors to keep behaviour consistent.

#### Status

- Exported `compareProviderModelEntries`, which prioritises recency, then recommendation score, then name/ID; reused everywhere we order models.

### Validate against sample datasets

#### Summary

Confirm the new sorting behaves as expected in multiple scenarios.

#### Description

- Craft fixture datasets representing full remote data, partial data, and offline-only fallbacks.
- Write unit tests or storybook-like playgrounds to check that the latest models appear first and manual weights break ties appropriately.
- Run `pnpm --filter @wrkspc/vsc-webview test/unit` to ensure the new logic passes and adjust tests for deterministic ordering.

#### Status

- Added `modelSorting.test.ts` to cover dynamic weights and comparator behaviour. `pnpm --filter @wrkspc/vsc-webview test/unit` still fails because existing suites require a `VscProvider`, but the new tests pass. `pnpm --filter @wrkspc/vsc-webview types` continues to fail with pre-existing workspace issues.

## Questions

None.

## Notes

- Consider exporting the comparator from a shared utility module so other components can reuse the same ordering semantics.
