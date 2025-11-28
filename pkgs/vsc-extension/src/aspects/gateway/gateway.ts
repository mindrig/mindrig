import { createGateway } from "@ai-sdk/gateway";
import { createOfflineGateway, createRecordGateway } from "./offline";

export function resolveGateway(apiKey: string) {
  if (process.env.MINDRIG_DEV_RECORD === "true")
    return createRecordGateway(apiKey);

  if (process.env.MINDRIG_DEV_OFFLINE === "true") return createOfflineGateway();

  return createGateway({ apiKey });
}
