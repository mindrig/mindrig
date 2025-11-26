import { CallSettings } from "ai";
import { Model, ModelSettings, sanitizeModelSettings } from "../model";
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
  const { reasoning, ...sanitizedSettings } = sanitizeModelSettings(settings);

  const aiSdkSettings: AiSdkSettings = {
    providerOptions: aiSdkProviderOptions(modelRef, settings),
    // TODO: CallSettings do not allow undefineds in optional types, make time
    // to address that.
    ...(sanitizedSettings as any),
  };

  return aiSdkSettings;
}
