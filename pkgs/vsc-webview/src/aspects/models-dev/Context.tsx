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
import { useMessage } from "@/aspects/message/messageContext";
import type { VscMessageModels } from "@wrkspc/vsc-message";
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

export function ModelsDevProvider(props: React.PropsWithChildren) {
  const { send, listen } = useMessage();

  const fetchModelsDev = useCallback(async () => {
    if (typeof window === "undefined") return FALLBACK_MODELS_DEV_DATA;

    const responsePromise = new Promise<ModelDotdev.ModelsDev.Data>(
      (resolve, reject) => {
        const subscription = listen(
          "models-dev-response",
          (message: Extract<VscMessageModels, { type: "models-dev-response" }>) => {
            cleanup();
            const payload = message.payload;
            if (payload.status === "ok") resolve(payload.data);
            else reject(new Error(payload.error ?? "Unknown models.dev error"));
          },
        );

        const timeoutId = setTimeout(() => {
          cleanup();
          reject(new Error("Timed out fetching models.dev data"));
        }, 5000);

        const cleanup = () => {
          clearTimeout(timeoutId);
          subscription.dispose();
        };

        try {
          send({ type: "models-dev-get" });
        } catch (error) {
          cleanup();
          reject(error instanceof Error ? error : new Error(String(error)));
        }
      },
    );

    try {
      return await responsePromise;
    } catch (error) {
      const response = await fetch(modelsDotdevUrl());
      if (!response.ok)
        throw new Error(`Failed to fetch models.dev: ${response.status}`);
      return (await response.json()) as ModelDotdev.ModelsDev.Data;
    }
  }, [listen, send]);

  const { data, error, isValidating, isLoading, mutate } = useSWR(
    SWR_KEY,
    fetchModelsDev,
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
