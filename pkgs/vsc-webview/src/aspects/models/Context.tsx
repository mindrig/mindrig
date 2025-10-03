import { useMessage } from "@/aspects/message/messageContext";
import { FALLBACK_MODELS_DEV_DATA } from "@/aspects/models-dev/fallback";
import {
  ModelDotdev,
  ModelGateway,
  ModelVercel,
  getModelCapabilities,
  setModelsDevData,
} from "@wrkspc/model";
import type { VscMessageAuth, VscMessageModels } from "@wrkspc/vsc-message";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface AvailableModel {
  id: string;
  name?: string;
  modelType?: string | null;
  specification?: { provider?: string };
  pricing?: Record<string, number>;
}

type ModelsDataResponseMessage = Extract<
  VscMessageModels,
  { type: "models-data-response" }
>;

type GatewayKeyStatusPayload = Extract<
  VscMessageAuth,
  { type: "auth-vercel-gateway-status" }
>["payload"];

export interface ModelsContextValue {
  gateway: ModelGateway.Response | undefined;
  gatewayModels: AvailableModel[];
  gatewayError: string | null;
  dotDev: ModelDotdev.Response | undefined;
  dotDevData: ModelDotdev.Data;
  dotDevError: string | null;
  isDotDevFallback: boolean;
  isLoading: boolean;
  keyStatus: GatewayKeyStatusPayload;
  retry: () => void;
  providers: Record<string, ModelDotdev.Provider>;
  modelsByProvider: Record<string, Record<string, ModelDotdev.Meta & { id: string }>>;
  getProvider: (
    providerId: string | null | undefined,
  ) => ModelDotdev.Provider | undefined;
  getModel: (
    providerId: string | null | undefined,
    modelId: string | null | undefined,
  ) => (ModelDotdev.Meta & { id: string }) | undefined;
  getCapabilities: (
    providerId: string | null | undefined,
    modelId: string | null | undefined,
  ) => ModelDotdev.Capabilities;
}

const ModelsContext = createContext<ModelsContextValue | undefined>(undefined);

const FALLBACK_DOTDEV_DATA =
  FALLBACK_MODELS_DEV_DATA as unknown as ModelDotdev.Data;

function mapGatewayModels(response: ModelGateway.Response | undefined): AvailableModel[] {
  if (!response || response.response.status !== "ok") return [];
  const models = response.response.data.models ?? [];
  return models
    .filter((model) => (model.modelType ?? "language") === "language")
    .map((model: ModelVercel.Model) => {
      const pricingEntries = model.pricing
        ? Object.fromEntries(
            Object.entries(model.pricing).map(([key, value]) => [
              key,
              Number(value),
            ]),
          )
        : undefined;

      const base = {
        id: model.id,
        name: model.name,
        modelType: model.modelType ?? null,
        specification: model.specification,
      };

      return pricingEntries !== undefined
        ? ({ ...base, pricing: pricingEntries } as AvailableModel)
        : (base as AvailableModel);
    });
}

function normalise(value: string | null | undefined) {
  return (value ?? "").toLowerCase();
}

export function ModelsProvider(props: React.PropsWithChildren) {
  const { send, listen } = useMessage();
  const [gateway, setGateway] = useState<ModelGateway.Response | undefined>();
  const [dotDev, setDotDev] = useState<ModelDotdev.Response | undefined>();
  const [isLoading, setIsLoading] = useState(true);
  const [keyStatus, setKeyStatus] = useState<GatewayKeyStatusPayload>({
    status: "idle",
    source: "fallback",
    fallbackUsed: false,
    userAttempted: false,
  });

  useEffect(() => {
    const modelsSubscription = listen("models-data-response", (message) => {
      const payload = message as ModelsDataResponseMessage;
      setGateway(payload.payload.gateway);
      setDotDev(payload.payload.dotDev);
      setIsLoading(false);
    });

    const keyStatusSubscription = listen("auth-vercel-gateway-status", (message) => {
      setKeyStatus(message.payload);
    });

    setIsLoading(true);
    send({ type: "models-data-get" });

    return () => {
      modelsSubscription.dispose();
      keyStatusSubscription.dispose();
    };
  }, [listen, send]);

  const retry = useCallback(() => {
    setIsLoading(true);
    send({ type: "models-data-get" });
  }, [send]);

  const dotDevData = useMemo<ModelDotdev.Data>(() => {
    if (dotDev?.status === "ok") return dotDev.data;
    return FALLBACK_DOTDEV_DATA;
  }, [dotDev]);

  useEffect(() => {
    if (dotDev?.status === "ok") setModelsDevData(dotDev.data);
    else setModelsDevData(FALLBACK_DOTDEV_DATA);
  }, [dotDev]);

  const providers = useMemo(() => {
    return Object.entries(dotDevData).reduce<Record<string, ModelDotdev.Provider>>(
      (acc, [key, provider]) => {
        const id = normalise(provider?.id ?? key);
        acc[id] = { ...provider, id: provider?.id ?? key } as ModelDotdev.Provider;
        return acc;
      },
      {},
    );
  }, [dotDevData]);

  const modelsByProvider = useMemo(() => {
    return Object.entries(dotDevData).reduce<
      Record<string, Record<string, ModelDotdev.Meta & { id: string }>>
    >((acc, [key, provider]) => {
      const providerId = normalise(provider?.id ?? key);
      const models = provider?.models ?? {};
      acc[providerId] = Object.entries(models).reduce<
        Record<string, ModelDotdev.Meta & { id: string }>
      >((inner, [modelKey, meta]) => {
        const id = normalise(modelKey);
        // @ts-expect-error -- dotdev schema exposes a superset of Meta
        inner[id] = { id: modelKey, ...(meta ?? {}) } as ModelDotdev.Meta & {
          id: string;
        };
        return inner;
      }, {});
      return acc;
    }, {});
  }, [dotDevData]);

  const getProvider = useCallback<ModelsContextValue["getProvider"]>(
    (providerId) => {
      const key = normalise(providerId);
      return providers[key];
    },
    [providers],
  );

  const getModel = useCallback<ModelsContextValue["getModel"]>(
    (providerId, modelId) => {
      const providerKey = normalise(providerId);
      const modelKey = normalise(modelId);
      return modelsByProvider[providerKey]?.[modelKey];
    },
    [modelsByProvider],
  );

  const getCapabilities = useCallback<ModelsContextValue["getCapabilities"]>(
    (providerId, modelId) => {
      return getModelCapabilities(providerId ?? "", modelId ?? "");
    },
    [],
  );

  const gatewayModels = useMemo(
    () => mapGatewayModels(gateway),
    [gateway],
  );

  const gatewayError = useMemo(() => {
    if (gateway?.response.status === "error") return gateway.response.message;
    if (keyStatus.status === "error")
      return keyStatus.message ?? "Failed to validate Vercel Gateway key.";
    return null;
  }, [gateway, keyStatus]);

  const dotDevError = useMemo(() => {
    if (dotDev?.status === "error") return dotDev.message;
    return null;
  }, [dotDev]);

  const value = useMemo<ModelsContextValue>(
    () => ({
      gateway,
      gatewayModels,
      gatewayError,
      dotDev,
      dotDevData,
      dotDevError,
      isDotDevFallback: dotDev?.status !== "ok",
      isLoading,
      keyStatus,
      retry,
      providers,
      modelsByProvider,
      getProvider,
      getModel,
      getCapabilities,
    }),
    [
      gateway,
      gatewayModels,
      gatewayError,
      dotDev,
      dotDevData,
      dotDevError,
      isLoading,
      keyStatus,
      retry,
      providers,
      modelsByProvider,
      getProvider,
      getModel,
      getCapabilities,
    ],
  );

  return (
    <ModelsContext.Provider value={value}>
      {props.children}
    </ModelsContext.Provider>
  );
}

export function useModels(): ModelsContextValue {
  const value = useContext(ModelsContext);
  if (!value)
    throw new Error("useModels must be used within a ModelsProvider");
  return value;
}
