# Model Sorting Refresh

## Brief

Improve the VS Code webview model selection experience by sourcing models.dev metadata via a shared React context that relies on SWR for caching, applying last-updated ordering with manual recommendation fallbacks, and preserving existing provider popularity behaviour.

## Steps

- [x] [Define Models.dev Context](.agents/plans/003-model-sorting/001-models-dev-context.md): Establish a reusable hook and provider that exposes models.dev data with SWR-based caching and offline defaults.
- [x] [Adopt SWR for Model Fetching](.agents/plans/003-model-sorting/002-swr-model-fetch.md): Replace imperative model loading in `Assessment` with SWR hooks, wiring status flags needed by the UI.
- [x] [Revise Sorting and Recommendations](.agents/plans/003-model-sorting/003-model-sorting-logic.md): Update model grouping logic to prefer last-updated timestamps and use manual recommendation weights as secondary ordering.
- [x] [Add Loading Status Indicator](.agents/plans/003-model-sorting/004-model-status-indicator.md): Surface a color-dot indicator near the model selector to reflect loading and error states.

### [Define Models.dev Context](.agents/plans/003-model-sorting/001-models-dev-context.md)

Design a React context provider patterned after `VscProvider` that fetches models.dev data once with SWR, normalises it for quick lookup, and exposes helpers for consumers along with fallback manual data when offline or pending.

### [Adopt SWR for Model Fetching](.agents/plans/003-model-sorting/002-swr-model-fetch.md)

Introduce SWR-driven hooks for the gateway model list and wire them into the assessment view, simplifying existing loading/error state handling while capturing the fetch status for downstream components.

### [Revise Sorting and Recommendations](.agents/plans/003-model-sorting/003-model-sorting-logic.md)

Refactor the model sorting pipeline to merge SWR data, prioritise `last_updated` timestamps, and fall back to curated recommendation scores for recency ties or offline mode, keeping provider popularity unchanged.

### [Add Loading Status Indicator](.agents/plans/003-model-sorting/004-model-status-indicator.md)

Implement a lightweight status indicator adjacent to the model selector that responds to SWR state (loading, success, error), reusing existing design tokens or utility classes and covering behaviour with UI tests where practical.

## Questions

### Status Indicator Styling

Do we have preferred design tokens or colors for loading, success, and error dots in the webview so the indicator blends with existing UI patterns?

#### Answer

Use a temporary neutral palette: medium gray (e.g., `#9CA3AF`) for loading, vivid green (e.g., `#22C55E`) for success, and saturated red (e.g., `#EF4444`) for errors until dedicated tokens ship.

### Popular Provider Scope

Should we treat the current manual list (OpenAI, Anthropic, Google, Meta, Mistral) as the "popular providers" whose latest models get explicit recommendation scores, or expand/shrink that set?

#### Answer

Keep the core five (OpenAI, Anthropic, Google, Meta, Mistral) and add Microsoft (Azure/Copilot) and xAI as ranked providers; both have meaningful share growth in 2025 enterprise and consumer usage metrics, while emerging players like DeepSeek remain secondary for now.

## Notes

Keep the existing provider popularity constants intact and layer new logic on top so regression risk stays low. Plan to add the `swr` dependency to the webview package and ensure models.dev metadata utilities continue to live in `@wrkspc/model` for reuse.

## Prompt

I want you to plan for an improved model sorting in the web view.

Right now we have provider and model popularity hardcoded. I want you to keep providers popularity as is, but for models, use https://model.dev data (we already consume it for some things) and sort models by last_updated. For models with the same updated date, use the hardcoded recommendation score, similar to what we have right now.

Recommendation should reflect what providers think are the best for the most tasks. Don't try to make it precise yet. Assign recommendations only to the latest models of the popular providers. To consume models.dev data, add React context (use VscProvider context as an example of the structure), so it is always available but also cached. useModelsDev would be a great name for user-facing hook.

Model.dev types are defined in pkgs/model/src/dotdev.ts. Use this pkg for all model data-related functionality and fns unless it's VS Code-specific.

For offline and as the initial value, fall back to the manual weights. Display a small indicator after model select if it is still loading or failed to fetch. No need to add any tooltips, just a color dot.

Instead of handling all-the fetch loading, pending and error states manually (like it is right now), use swr: https://swr.vercel.app/.
