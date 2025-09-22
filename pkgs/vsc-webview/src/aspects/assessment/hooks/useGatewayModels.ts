import { createGateway } from "@ai-sdk/gateway";
import { useMemo } from "react";
import useSWR from "swr";
import type { KeyedMutator } from "swr";

export interface AvailableModel {
  id: string;
  name?: string;
  modelType?: string | null;
  specification?: { provider?: string };
  pricing?: Record<string, number>;
}

const SWR_SCOPE = "gateway-models" as const;
const PUBLIC_KEY = "public" as const;

type SwrKey = [typeof SWR_SCOPE, string | typeof PUBLIC_KEY];

async function fetchGatewayModels([, key]: SwrKey): Promise<AvailableModel[]> {
  const apiKey = key === PUBLIC_KEY ? null : key;

  const response = apiKey
    ? await createGateway({ apiKey }).getAvailableModels()
    : await fetch(
        `${import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN}/vercel/models`,
      ).then((r) => {
        if (!r.ok) throw new Error(`Failed to fetch models: HTTP ${r.status}`);
        return r.json();
      });

  const models = Array.isArray(response.models) ? response.models : [];
  return models.filter(
    (model: any): model is AvailableModel =>
      (model?.modelType ?? "language") === "language",
  );
}

export interface UseGatewayModelsResult {
  models: AvailableModel[] | undefined;
  isLoading: boolean;
  isValidating: boolean;
  error: unknown;
  isFallback: boolean;
  mutate: KeyedMutator<AvailableModel[]>;
}

export function useGatewayModels(
  vercelGatewayKey: string | null | undefined,
): UseGatewayModelsResult {
  const shouldFetch = vercelGatewayKey !== undefined;
  const swrKey = useMemo<SwrKey | null>(() => {
    if (!shouldFetch) return null;
    return [SWR_SCOPE, vercelGatewayKey ?? PUBLIC_KEY];
  }, [shouldFetch, vercelGatewayKey]);

  const { data, error, isLoading, isValidating, mutate } = useSWR(
    swrKey,
    fetchGatewayModels,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: false,
      errorRetryCount: 1,
      dedupingInterval: 60_000,
    },
  );

  return {
    models: data,
    isLoading: Boolean(isLoading) || (!data && shouldFetch && !error),
    isValidating: Boolean(isValidating),
    error: error ?? null,
    isFallback: !data,
    mutate,
  };
}
