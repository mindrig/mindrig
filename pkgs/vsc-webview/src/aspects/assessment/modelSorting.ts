export const PROVIDER_POPULARITY: Record<string, number> = {
  openai: 100,
  anthropic: 95,
  google: 90,
  microsoft: 85,
  meta: 80,
  mistral: 70,
  xai: 60,
};

export const POPULAR_PROVIDER_SET = new Set(Object.keys(PROVIDER_POPULARITY));

export const OFFLINE_MODEL_RECOMMENDATIONS: Record<
  string,
  Record<string, number>
> = {
  openai: {
    "gpt-5": 100,
    "gpt-5-mini": 95,
    "gpt-5-chat": 90,
  },
  anthropic: {
    "claude-opus-4.1": 100,
    "claude-sonnet-4": 95,
    "claude-3.7-sonnet": 90,
  },
  google: {
    "gemini-2.5-flash": 100,
    "gemini-2.5-pro": 95,
    "gemini-2.5-flash-preview-05-20": 90,
  },
  microsoft: {
    "gpt-5": 100,
    "gpt-5-chat": 95,
    "gpt-5-mini": 90,
  },
  meta: {
    "llama-4-scout-17b": 100,
    "llama-4-maverick-17b": 95,
    "llama-3.3-70b-instruct": 90,
  },
  mistral: {
    "mistral-medium-3.1": 100,
    "mistral-medium-3": 95,
    "mistral-small-3.2-24b-instruct": 90,
  },
  xai: {
    "grok-4": 100,
    "grok-3-mini-fast-latest": 95,
    "grok-3-latest": 90,
  },
};

export const DYNAMIC_RECOMMENDATION_WEIGHTS = [100, 95, 90];

export function normaliseProviderId(value: string | undefined | null): string {
  return (value ?? "").toLowerCase();
}

export function modelKeyFromId(id: string | undefined | null): string {
  if (!id) return "";
  return id.split("/").pop()?.toLowerCase() ?? id.toLowerCase();
}

export function parseLastUpdatedMs(value: unknown): number {
  if (!value || typeof value !== "string") return 0;
  const timestamp = Date.parse(value);
  return Number.isFinite(timestamp) ? timestamp : 0;
}

export interface ProviderModelOrderingEntry {
  id: string;
  name?: string;
  lastUpdatedMs: number;
}

export interface ProviderModelWithScore extends ProviderModelOrderingEntry {
  recommendationScore: number;
}

export function computeRecommendationWeightsForProvider(
  providerId: string,
  entries: ProviderModelOrderingEntry[],
  options: { modelsDevFallback: boolean },
): Record<string, number> {
  const normalised = normaliseProviderId(providerId);
  const offline = OFFLINE_MODEL_RECOMMENDATIONS[normalised] ?? {};

  if (!POPULAR_PROVIDER_SET.has(normalised)) return {};
  if (options.modelsDevFallback) return { ...offline };

  const sorted = [...entries].sort((a, b) => b.lastUpdatedMs - a.lastUpdatedMs);
  const hasTimestamps = sorted.some((entry) => entry.lastUpdatedMs > 0);

  if (!hasTimestamps) return { ...offline };

  const weights: Record<string, number> = {};
  sorted.forEach((entry, index) => {
    if (index >= DYNAMIC_RECOMMENDATION_WEIGHTS.length) return;
    const weight = DYNAMIC_RECOMMENDATION_WEIGHTS[index];
    if (typeof weight === "number") weights[modelKeyFromId(entry.id)] = weight;
  });

  return weights;
}

export function compareProviderModelEntries(
  a: ProviderModelWithScore,
  b: ProviderModelWithScore,
): number {
  if (a.lastUpdatedMs !== b.lastUpdatedMs)
    return b.lastUpdatedMs - a.lastUpdatedMs;
  if (a.recommendationScore !== b.recommendationScore)
    return b.recommendationScore - a.recommendationScore;
  const nameA = a.name || a.id;
  const nameB = b.name || b.id;
  return nameA.localeCompare(nameB);
}
