import { createContext, useContext } from "react";
import { ModelsSource, useModelsSource } from "./source";

// type ModelsDataResponseMessage = Extract<
//   VscMessageModels,
//   { type: "models-data-response" }
// >;

// type GatewayKeyStatusPayload = Extract<
//   VscMessageAuth,
//   { type: "auth-vercel-gateway-status" }
// >["payload"];

export interface ModelsContextValue {
  gateway: ModelsSource<"gateway">;
  dotdev: ModelsSource<"dotdev">;
  //   dotDevData: ModelDotdev.Data;
  //   dotDevError: string | null;
  //   isDotDevFallback: boolean;
  //   isLoading: boolean;
  //   keyStatus: GatewayKeyStatusPayload;
  //   retry: () => void;
  //   providers: Record<string, ModelDotdev.Provider>;
  //   modelsByProvider: Record<
  //     string,
  //     Record<string, ModelDotdev.Meta & { id: string }>
  //   >;
  //   getProvider: (
  //     providerId: string | null | undefined,
  //   ) => ModelDotdev.Provider | undefined;
  //   getModel: (
  //     providerId: string | null | undefined,
  //     modelId: string | null | undefined,
  //   ) => (ModelDotdev.Meta & { id: string }) | undefined;
  //   getCapabilities: (
  //     providerId: string | null | undefined,
  //     modelId: string | null | undefined,
  //   ) => ModelDotdev.Capabilities;
}

const ModelsContext = createContext<ModelsContextValue | undefined>(undefined);

// const FALLBACK_DOTDEV_DATA =
//   FALLBACK_MODELS_DEV_DATA as unknown as ModelDotdev.Data;

// function mapGatewayModels(
//   response: ModelGateway.Response | undefined,
// ): AvailableModel[] {
//   if (!response || response.response.status !== "ok") return [];
//   const models = response.response.data.models ?? [];
//   return models
//     .filter((model) => (model.modelType ?? "language") === "language")
//     .map((model: ModelVercel.Model) => {
//       const pricingEntries = model.pricing
//         ? Object.fromEntries(
//             Object.entries(model.pricing).map(([key, value]) => [
//               key,
//               Number(value),
//             ]),
//           )
//         : undefined;

//       const base = {
//         id: model.id,
//         name: model.name,
//         modelType: model.modelType ?? null,
//         specification: model.specification,
//       };

//       return pricingEntries !== undefined
//         ? ({ ...base, pricing: pricingEntries } as AvailableModel)
//         : (base as AvailableModel);
//     });
// }

// function normalise(value: string | null | undefined) {
//   return (value ?? "").toLowerCase();
// }

export function ModelsProvider(props: React.PropsWithChildren) {
  const dotdev = useModelsSource("dotdev");
  const gateway = useModelsSource("gateway");
  // const { send, listen } = useMessages();
  // const [gateway, setGateway] = useState<
  //   ModelsSourceState<ModelGateway.Response>
  // >(emptyModelsSourceState);
  // const [dotdev, setDotdev] = useState<ModelsSourceState<ModelDotdev.Response>>(
  //   emptyModelsSourceState,
  // );

  // useEffect(() => {
  //   listen("models-ext-gateway-response", (message) => {
  //     setGateway({
  //       response: message.payload,
  //       waiting: false,
  //     });
  //   });

  //   listen("models-ext-dotdev-response", (message) => {
  //     setDotdev({
  //       response: message.payload,
  //       waiting: false,
  //     });
  //   });
  // }, [listen]);

  // const [__gateway, __setGateway] = useState<
  //   ModelGateway.Response | undefined
  // >();
  // const [__dotdev, __setDotdev] = useState<ModelDotdev.Response | undefined>();
  // const [isLoading, setIsLoading] = useState(true);
  // const [keyStatus, setKeyStatus] = useState<GatewayKeyStatusPayload>({
  //   status: "idle",
  //   source: "fallback",
  //   fallbackUsed: false,
  //   userAttempted: false,
  // });

  // useEffect(() => {
  //   const modelsSubscription = listen("models-data-response", (message) => {
  //     const payload = message as ModelsDataResponseMessage;
  //     __setGateway(payload.payload.gateway);
  //     __setDotdev(payload.payload.dotDev);
  //     setIsLoading(false);
  //   });

  //   const keyStatusSubscription = listen(
  //     "auth-vercel-gateway-status",
  //     (message) => {
  //       setKeyStatus(message.payload);
  //     },
  //   );

  //   setIsLoading(true);
  //   send({ type: "models-data-get" });

  //   return () => {
  //     modelsSubscription.dispose();
  //     keyStatusSubscription.dispose();
  //   };
  // }, [listen, send]);

  // const retry = useCallback(() => {
  //   setIsLoading(true);
  //   send({ type: "models-data-get" });
  // }, [send]);

  // const dotDevData = useMemo<ModelDotdev.Data>(() => {
  //   if (__dotdev?.status === "ok") return __dotdev.data;
  //   return FALLBACK_DOTDEV_DATA;
  // }, [__dotdev]);

  // useEffect(() => {
  //   if (__dotdev?.status === "ok") setModelsDevData(__dotdev.data);
  //   else setModelsDevData(FALLBACK_DOTDEV_DATA);
  // }, [__dotdev]);

  // const providers = useMemo(() => {
  //   return Object.entries(dotDevData).reduce<
  //     Record<string, ModelDotdev.Provider>
  //   >((acc, [key, provider]) => {
  //     const id = normalise(provider?.id ?? key);
  //     acc[id] = {
  //       ...provider,
  //       id: provider?.id ?? key,
  //     } as ModelDotdev.Provider;
  //     return acc;
  //   }, {});
  // }, [dotDevData]);

  // const modelsByProvider = useMemo(() => {
  //   return Object.entries(dotDevData).reduce<
  //     Record<string, Record<string, ModelDotdev.Meta & { id: string }>>
  //   >((acc, [key, provider]) => {
  //     const providerId = normalise(provider?.id ?? key);
  //     const models = provider?.models ?? {};
  //     acc[providerId] = Object.entries(models).reduce<
  //       Record<string, ModelDotdev.Meta & { id: string }>
  //     >((inner, [modelKey, meta]) => {
  //       const id = normalise(modelKey);
  //       // @ts-expect-error -- dotdev schema exposes a superset of Meta
  //       inner[id] = { id: modelKey, ...(meta ?? {}) } as ModelDotdev.Meta & {
  //         id: string;
  //       };
  //       return inner;
  //     }, {});
  //     return acc;
  //   }, {});
  // }, [dotDevData]);

  // const getProvider = useCallback<ModelsContextValue["getProvider"]>(
  //   (providerId) => {
  //     const key = normalise(providerId);
  //     return providers[key];
  //   },
  //   [providers],
  // );

  // const getModel = useCallback<ModelsContextValue["getModel"]>(
  //   (providerId, modelId) => {
  //     const providerKey = normalise(providerId);
  //     const modelKey = normalise(modelId);
  //     return modelsByProvider[providerKey]?.[modelKey];
  //   },
  //   [modelsByProvider],
  // );

  // const getCapabilities = useCallback<ModelsContextValue["getCapabilities"]>(
  //   (providerId, modelId) => {
  //     return getModelCapabilities(providerId ?? "", modelId ?? "");
  //   },
  //   [],
  // );

  // const gatewayModels = useMemo(() => mapGatewayModels(__gateway), [__gateway]);

  // const gatewayError = useMemo(() => {
  //   if (__gateway?.response.status === "error")
  //     return __gateway.response.message;
  //   if (keyStatus.status === "error")
  //     return keyStatus.message ?? "Failed to validate Vercel Gateway key.";
  //   return null;
  // }, [__gateway, keyStatus]);

  // const dotDevError = useMemo(() => {
  //   if (__dotdev?.status === "error") return __dotdev.message;
  //   return null;
  // }, [__dotdev]);

  // const value = useMemo<ModelsContextValue>(
  //   () => ({
  //     gateway: __gateway,
  //     gatewayModels,
  //     gatewayError,
  //     dotDev: __dotdev,
  //     dotDevData,
  //     dotDevError,
  //     isDotDevFallback: __dotdev?.status !== "ok",
  //     isLoading,
  //     keyStatus,
  //     retry,
  //     providers,
  //     modelsByProvider,
  //     getProvider,
  //     getModel,
  //     getCapabilities,
  //   }),
  //   [
  //     __gateway,
  //     gatewayModels,
  //     gatewayError,
  //     __dotdev,
  //     dotDevData,
  //     dotDevError,
  //     isLoading,
  //     keyStatus,
  //     retry,
  //     providers,
  //     modelsByProvider,
  //     getProvider,
  //     getModel,
  //     getCapabilities,
  //   ],
  // );

  return (
    <ModelsContext.Provider value={{ dotdev, gateway }}>
      {props.children}
    </ModelsContext.Provider>
  );
}

export function useModels(): ModelsContextValue {
  const value = useContext(ModelsContext);
  if (!value) throw new Error("useModels must be used within a ModelsProvider");
  return value;
}

//#region Legacy

export interface AvailableModel {
  id: string;
  name?: string;
  modelType?: string | null;
  specification?: { provider?: string };
  pricing?: Record<string, number>;
}

//#endregion
