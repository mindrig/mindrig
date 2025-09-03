/**
 * Minimal capabilities map distilled from models.dev data.
 * Extend this as needed; keys are provider ids and model id substrings.
 */
export interface Capabilities {
  supportsImages: boolean;
  supportsVideo: boolean;
  supportsFiles: boolean;
  supportsTools: boolean;
  supportsReasoning: boolean;
}

type ModelsDev = Record<
  string,
  {
    id: string;
    models: Record<
      string,
      {
        modalities?: { input?: string[]; output?: string[] };
        attachment?: boolean;
        tool_call?: boolean;
        reasoning?: boolean;
      }
    >;
  }
>;

let MODELS_DEV_CACHE: ModelsDev | null = null;

export function setModelsDevData(data: ModelsDev | null) {
  MODELS_DEV_CACHE = data;
}

export function getModelCapabilities(
  provider: string,
  modelId: string,
): Capabilities {
  const prov = (provider || "").toLowerCase();
  const id = (modelId || "").toLowerCase();

  const fallback: Capabilities = {
    supportsImages: false,
    supportsVideo: false,
    supportsFiles: false,
    supportsTools: true,
    supportsReasoning: false,
  };

  const data = MODELS_DEV_CACHE;
  if (!data) return fallback;

  const provData = (data as any)[prov];
  const models: Record<string, any> | undefined = provData?.models;
  if (models) {
    const entries = Object.entries(models);
    for (const [key, meta] of entries) {
      if (!id.includes(key.toLowerCase())) continue;
      const input: string[] = meta?.modalities?.input || [];
      return {
        supportsImages: input.includes("image"),
        supportsVideo: input.includes("video"),
        supportsFiles: !!meta?.attachment,
        supportsTools: !!meta?.tool_call,
        supportsReasoning: !!meta?.reasoning,
      } as Capabilities;
    }
  }

  // Secondary: scan all providers to match by key substring
  for (const provEntry of Object.values(data as any) as any[]) {
    const m = provEntry?.models || {};
    for (const [key, meta] of Object.entries(m)) {
      if (!id.includes((key as string).toLowerCase())) continue;
      const input: string[] = (meta as any)?.modalities?.input || [];
      return {
        supportsImages: input.includes("image"),
        supportsVideo: input.includes("video"),
        supportsFiles: !!(meta as any)?.attachment,
        supportsTools: !!(meta as any)?.tool_call,
        supportsReasoning: !!(meta as any)?.reasoning,
      } as Capabilities;
    }
  }

  return fallback;
}
