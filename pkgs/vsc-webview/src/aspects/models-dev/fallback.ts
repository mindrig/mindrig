import type { ModelDotdev } from "@wrkspc/model";

interface FallbackModelInput {
  id: string;
  name?: string;
  last_updated: string;
}

function modelsWithMetadata(
  models: FallbackModelInput[],
): Record<string, ModelDotdev.Meta> {
  return models.reduce<Record<string, ModelDotdev.Meta>>((acc, model) => {
    acc[model.id] = {
      ...(model.name ? { name: model.name } : {}),
      last_updated: model.last_updated,
    } as ModelDotdev.Meta;
    return acc;
  }, {});
}

export const FALLBACK_MODELS_DEV_DATA: ModelDotdev.Response = {
  openai: {
    id: "openai",
    name: "OpenAI",
    models: modelsWithMetadata([
      { id: "gpt-5", name: "GPT-5", last_updated: "2025-08-07T00:00:00Z" },
      {
        id: "gpt-5-mini",
        name: "GPT-5 Mini",
        last_updated: "2025-08-07T00:00:00Z",
      },
      {
        id: "gpt-5-chat",
        name: "GPT-5 Chat",
        last_updated: "2025-08-07T00:00:00Z",
      },
    ]),
  },
  anthropic: {
    id: "anthropic",
    name: "Anthropic",
    models: modelsWithMetadata([
      {
        id: "claude-opus-4.1",
        name: "Claude Opus 4.1",
        last_updated: "2025-08-05T00:00:00Z",
      },
      {
        id: "claude-sonnet-4",
        name: "Claude Sonnet 4",
        last_updated: "2025-05-22T00:00:00Z",
      },
      {
        id: "claude-3.7-sonnet",
        name: "Claude Sonnet 3.7",
        last_updated: "2025-02-19T00:00:00Z",
      },
    ]),
  },
  google: {
    id: "google",
    name: "Google",
    models: modelsWithMetadata([
      {
        id: "gemini-2.5-flash",
        name: "Gemini 2.5 Flash",
        last_updated: "2025-07-17T00:00:00Z",
      },
      {
        id: "gemini-2.5-pro",
        name: "Gemini 2.5 Pro",
        last_updated: "2025-06-05T00:00:00Z",
      },
      {
        id: "gemini-2.5-flash-preview-05-20",
        name: "Gemini 2.5 Flash Preview 05-20",
        last_updated: "2025-05-20T00:00:00Z",
      },
    ]),
  },
  meta: {
    id: "meta",
    name: "Meta",
    models: modelsWithMetadata([
      {
        id: "llama-4-scout-17b",
        name: "Llama 4 Scout 17B",
        last_updated: "2025-04-05T00:00:00Z",
      },
      {
        id: "llama-4-maverick-17b",
        name: "Llama 4 Maverick 17B",
        last_updated: "2025-04-05T00:00:00Z",
      },
      {
        id: "llama-3.3-70b-instruct",
        name: "Llama 3.3 70B Instruct",
        last_updated: "2024-12-06T00:00:00Z",
      },
    ]),
  },
  mistral: {
    id: "mistral",
    name: "Mistral",
    models: modelsWithMetadata([
      {
        id: "mistral-medium-3.1",
        name: "Mistral Medium 3.1",
        last_updated: "2025-08-12T00:00:00Z",
      },
      {
        id: "mistral-medium-3",
        name: "Mistral Medium 3",
        last_updated: "2025-05-07T00:00:00Z",
      },
      {
        id: "mistral-small-3.2-24b-instruct",
        name: "Mistral Small 3.2 24B Instruct",
        last_updated: "2025-06-20T00:00:00Z",
      },
    ]),
  },
  microsoft: {
    id: "microsoft",
    name: "Microsoft",
    models: modelsWithMetadata([
      {
        id: "gpt-5",
        name: "GPT-5 (Azure)",
        last_updated: "2025-08-07T00:00:00Z",
      },
      {
        id: "gpt-5-chat",
        name: "GPT-5 Chat (Azure)",
        last_updated: "2025-08-07T00:00:00Z",
      },
      {
        id: "gpt-5-mini",
        name: "GPT-5 Mini (Azure)",
        last_updated: "2025-08-07T00:00:00Z",
      },
    ]),
  },
  xai: {
    id: "xai",
    name: "xAI",
    models: modelsWithMetadata([
      {
        id: "grok-4",
        name: "Grok 4",
        last_updated: "2025-07-09T00:00:00Z",
      },
      {
        id: "grok-3-mini-fast-latest",
        name: "Grok 3 Mini Fast Latest",
        last_updated: "2025-02-17T00:00:00Z",
      },
      {
        id: "grok-3-latest",
        name: "Grok 3 Latest",
        last_updated: "2025-02-17T00:00:00Z",
      },
    ]),
  },
} as unknown as ModelDotdev.Response;

export const MODELS_DEV_REVALIDATE_OPTIONS = {
  revalidateOnFocus: false,
  revalidateOnReconnect: false,
  dedupingInterval: 5 * 60 * 1000,
} as const;
