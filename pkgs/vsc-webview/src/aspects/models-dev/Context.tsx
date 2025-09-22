import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
} from "react";
import useSWR from "swr";
import type { KeyedMutator } from "swr";
import {
  ModelDotdev,
  getModelCapabilities,
  modelsDotdevUrl,
  setModelsDevData,
} from "@wrkspc/model";
import { useVsc } from "@/aspects/vsc/Context";
import type { Vsc } from "@/aspects/vsc/api";
import {
  FALLBACK_MODELS_DEV_DATA,
  MODELS_DEV_REVALIDATE_OPTIONS,
} from "./fallback";

const SWR_KEY = "models.dev";

function normalise(value: string | null | undefined): string {
  return (value ?? "").toLowerCase();
}

export interface ModelsDevContextValue {
  data: ModelDotdev.ModelsDev.Data;
  providers: Record<string, ModelDotdev.ModelsDev.Provider>;
  modelsByProvider: Record<
    string,
    Record<string, ModelDotdev.ModelsDev.ModelMeta & { id: string }>
  >;
  getProvider: (
    providerId: string | null | undefined,
  ) => ModelDotdev.ModelsDev.Provider | undefined;
  getModel: (
    providerId: string | null | undefined,
    modelId: string | null | undefined,
  ) => (ModelDotdev.ModelsDev.ModelMeta & { id: string }) | undefined;
  getCapabilities: (
    providerId: string | null | undefined,
    modelId: string | null | undefined,
  ) => ModelDotdev.Capabilities;
  isLoading: boolean;
  isValidating: boolean;
  isFallback: boolean;
  error: unknown;
  mutate: KeyedMutator<ModelDotdev.ModelsDev.Data>;
}

const ModelsDevContext = createContext<ModelsDevContextValue | undefined>(
  undefined,
);

async function fetchModelsDev(
  vsc: Vsc.Api | undefined,
): Promise<ModelDotdev.ModelsDev.Data> {
  if (typeof window === "undefined") return FALLBACK_MODELS_DEV_DATA;

  if (!vsc?.postMessage) {
    const response = await fetch(modelsDotdevUrl());
    if (!response.ok)
      throw new Error(`Failed to fetch models.dev: ${response.status}`);
    return (await response.json()) as ModelDotdev.ModelsDev.Data;
  }

  return new Promise<ModelDotdev.ModelsDev.Data>((resolve, reject) => {
    let settled = false;
    let timeout: ReturnType<typeof setTimeout> | undefined;

    const cleanup = () => {
      if (timeout) clearTimeout(timeout);
      window.removeEventListener("message", handleMessage);
    };

    const handleMessage = (event: MessageEvent) => {
      const message = event.data;
      if (!message || message.type !== "modelsDev") return;
      settled = true;
      cleanup();
      if (message.payload?.data) {
        resolve(message.payload.data as ModelDotdev.ModelsDev.Data);
      } else {
        const errorMessage =
          message.payload?.error || "Unknown models.dev error";
        reject(new Error(errorMessage));
      }
    };

    window.addEventListener("message", handleMessage);

    try {
      vsc.postMessage({ type: "getModelsDev" });
    } catch (error) {
      cleanup();
      reject(error instanceof Error ? error : new Error(String(error)));
      return;
    }

    timeout = setTimeout(() => {
      if (!settled) {
        cleanup();
        reject(new Error("Timed out fetching models.dev data"));
      }
    }, 5000);
  });
}

export function ModelsDevProvider(props: React.PropsWithChildren) {
  const { vsc } = useVsc();

  const { data, error, isValidating, isLoading, mutate } = useSWR(
    SWR_KEY,
    () => fetchModelsDev(vsc),
    {
      fallbackData: FALLBACK_MODELS_DEV_DATA,
      keepPreviousData: true,
      ...MODELS_DEV_REVALIDATE_OPTIONS,
    },
  );

  useEffect(() => {
    setModelsDevData(data ?? null);
    return () => {
      setModelsDevData(null);
    };
  }, [data]);

  const providers = useMemo(() => {
    const source = data ?? FALLBACK_MODELS_DEV_DATA;
    return Object.entries(source).reduce<
      Record<string, ModelDotdev.ModelsDev.Provider>
    >((acc, [key, provider]) => {
      const id = normalise(provider?.id ?? key);
      acc[id] = { ...provider, id: provider?.id ?? key };
      return acc;
    }, {});
  }, [data]);

  const modelsByProvider = useMemo(() => {
    const result: ModelsDevContextValue["modelsByProvider"] = {};
    Object.entries(data ?? FALLBACK_MODELS_DEV_DATA).forEach(
      ([key, provider]) => {
        const providerId = normalise(provider?.id ?? key);
        const models = provider?.models ?? {};
        result[providerId] = Object.entries(models).reduce<
          Record<string, ModelDotdev.ModelsDev.ModelMeta & { id: string }>
        >((acc, [modelKey, meta]) => {
          const id = normalise(modelKey);
          acc[id] = { id: modelKey, ...(meta ?? {}) };
          return acc;
        }, {});
      },
    );
    return result;
  }, [data]);

  const getProvider = useCallback<ModelsDevContextValue["getProvider"]>(
    (providerId) => {
      const key = normalise(providerId);
      return providers[key];
    },
    [providers],
  );

  const getModel = useCallback<ModelsDevContextValue["getModel"]>(
    (providerId, modelId) => {
      const providerKey = normalise(providerId);
      const modelKey = normalise(modelId);
      return modelsByProvider[providerKey]?.[modelKey];
    },
    [modelsByProvider],
  );

  const getCapabilities = useCallback<ModelsDevContextValue["getCapabilities"]>(
    (providerId, modelId) => {
      return getModelCapabilities(providerId ?? "", modelId ?? "");
    },
    [],
  );

  const resolvedError = error ?? null;

  const value = useMemo<ModelsDevContextValue>(
    () => ({
      data: data ?? FALLBACK_MODELS_DEV_DATA,
      providers,
      modelsByProvider,
      getProvider,
      getModel,
      getCapabilities,
      isLoading,
      isValidating,
      isFallback: Object.is(data, FALLBACK_MODELS_DEV_DATA),
      error: resolvedError,
      mutate,
    }),
    [
      data,
      providers,
      modelsByProvider,
      getProvider,
      getModel,
      getCapabilities,
      isLoading,
      isValidating,
      resolvedError,
      mutate,
    ],
  );

  return (
    <ModelsDevContext.Provider value={value}>
      {props.children}
    </ModelsDevContext.Provider>
  );
}

export function useModelsDev(): ModelsDevContextValue {
  const value = useContext(ModelsDevContext);
  if (!value)
    throw new Error("useModelsDev must be used within a ModelsDevProvider");
  return value;
}
