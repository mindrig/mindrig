import { createGateway, GatewayProvider } from "@ai-sdk/gateway";
import {
  createOpenAICompatible,
  OpenAICompatibleProvider,
} from "@ai-sdk/openai-compatible";
import { DEMO_GATEWAY_MODEL_ID } from "@wrkspc/core/gateway";
import { createOfflineGateway, createRecordGateway } from "./offline";

export function resolveGateway<Key extends string | undefined>(
  apiKey: Key,
): Key extends undefined
  ? GatewayProvider | OpenAICompatibleProvider
  : GatewayProvider {
  const gateway = apiKey ? createGateway({ apiKey }) : createDemoGateway();

  if (process.env.MINDRIG_DEV_RECORD === "true")
    // TODO: Figure out proper fix for types
    return createRecordGateway(gateway as GatewayProvider);

  if (process.env.MINDRIG_DEV_OFFLINE === "true") return createOfflineGateway();

  return gateway as any;
}

export function createDemoGateway(): OpenAICompatibleProvider {
  const gateway = createOpenAICompatible({
    name: "demo",
    baseURL: `${import.meta.env.VITE_MINDRIG_GATEWAY_ORIGIN}/demo/proxy/v1`,
  });

  return Object.assign((_: string) => gateway(DEMO_GATEWAY_MODEL_ID), {
    ...gateway,
  });
}
