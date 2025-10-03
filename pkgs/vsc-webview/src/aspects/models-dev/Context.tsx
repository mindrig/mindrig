import {
  ModelsProvider,
  useModels,
} from "@/aspects/models/Context";

export { ModelsProvider as ModelsDevProvider };

export function useModelsDev() {
  const {
    dotDevData,
    providers,
    modelsByProvider,
    getProvider,
    getModel,
    getCapabilities,
    isDotDevFallback,
    isLoading,
    dotDevError,
  } = useModels();

  return {
    data: dotDevData,
    providers,
    modelsByProvider,
    getProvider,
    getModel,
    getCapabilities,
    isFallback: isDotDevFallback,
    isLoading,
    error: dotDevError,
  } as const;
}
