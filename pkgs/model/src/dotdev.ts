export function modelsDotdevUrl(): string {
  return "https://models.dev/api.json";
}

export namespace ModelDotdev {
  export interface Capabilities {
    supportsImages: boolean;
    supportsVideo: boolean;
    supportsFiles: boolean;
    supportsTools: boolean;
    supportsReasoning: boolean;
  }

  export namespace ModelsDev {
    export interface Modalities {
      input?: string[];
      output?: string[];
    }

    export interface ModelMeta {
      modalities?: Modalities;
      attachment?: boolean;
      tool_call?: boolean;
      reasoning?: boolean;
    }

    export interface Provider {
      id: string;
      models: Record<string, ModelMeta>;
    }

    export type Data = Record<string, Provider>;
  }
}

let MODELS_DEV_CACHE: ModelDotdev.ModelsDev.Data | null = null;

export function setModelsDevData(data: ModelDotdev.ModelsDev.Data | null) {
  MODELS_DEV_CACHE = data;
}

export function getModelCapabilities(
  provider: string,
  modelId: string,
): ModelDotdev.Capabilities {
  const prov = (provider || "").toLowerCase();
  const id = (modelId || "").toLowerCase();

  const fallback: ModelDotdev.Capabilities = {
    supportsImages: false,
    supportsVideo: false,
    supportsFiles: false,
    supportsTools: false,
    supportsReasoning: false,
  };

  const data = MODELS_DEV_CACHE as any;
  if (!data) return fallback;

  const provData = data[prov];
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
      } as ModelDotdev.Capabilities;
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
      } as ModelDotdev.Capabilities;
    }
  }

  return fallback;
}

export function providerFromEntry(entry: {
  id: string | undefined | null;
  specification?: { provider?: string } | undefined | null;
}): string {
  const id = entry?.id || "";
  const provider = entry?.specification?.provider || id.split("/")[0] || "";
  return provider;
}

export function selectedModelCapabilities(entry: {
  id: string | undefined | null;
  specification?: { provider?: string } | undefined | null;
}): ModelDotdev.Capabilities & { provider: string } {
  const provider = providerFromEntry(entry);
  const id = entry?.id || "";
  const caps = getModelCapabilities(provider, id);
  return { ...caps, provider };
}

export function providerLogoUrl(
  providerId: string | undefined | null,
  opts?: { base?: string; format?: "svg" | "png" },
): string {
  const id = (providerId ?? "").toLowerCase().trim();
  if (!id) return "";
  const base = opts?.base ?? "https://models.dev/logos";
  const format = opts?.format ?? "svg";
  return `${base}/${encodeURIComponent(id)}.${format}`;
}
