import { CallSettings } from "ai";
import { Model, ModelSettings } from "../model";
import { AiSdkProvider, aiSdkProviderOptions } from "./provider";

export interface AiSdkSettings
  extends Pick<CallSettings, AiSdkSettings.Overlap> {
  providerOptions?: AiSdkProvider.OptionsProp;
}

export namespace AiSdkSettings {
  export type Overlap = Extract<keyof CallSettings, keyof ModelSettings>;
}

export function aiSdkSettings(
  modelRef: Model.Ref,
  settings: ModelSettings,
): AiSdkSettings {
  const aiSdkSettings: AiSdkSettings = {
    providerOptions: aiSdkProviderOptions(modelRef, settings),
  };

  // TODO: CallSettings do not allow undefineds in optional types, make time
  // to address that.

  if (typeof settings.maxOutputTokens === "number")
    aiSdkSettings.maxOutputTokens = settings.maxOutputTokens;

  if (typeof settings.temperature === "number")
    aiSdkSettings.temperature = settings.temperature;

  if (typeof settings.topP === "number") aiSdkSettings.topP = settings.topP;

  if (typeof settings.topK === "number") aiSdkSettings.topK = settings.topK;

  if (typeof settings.presencePenalty === "number")
    aiSdkSettings.presencePenalty = settings.presencePenalty;

  if (typeof settings.frequencyPenalty === "number")
    aiSdkSettings.frequencyPenalty = settings.frequencyPenalty;

  if (Array.isArray(settings.stopSequences))
    aiSdkSettings.stopSequences = settings.stopSequences;

  if (typeof settings.seed === "number") aiSdkSettings.seed = settings.seed;

  return aiSdkSettings;
}
