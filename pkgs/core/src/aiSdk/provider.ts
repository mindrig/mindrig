import { JSONValue } from "ai";
import { Model, ModelSettings } from "../model";
import { aiSdkReasoningForModel } from "./reasoning";

export namespace AiSdkProvider {
  // NOTE: AI SDK doesn't export options type
  export type OptionsProp = Record<string, Options>;

  export type Options = Record<string, JSONValue>;
}

export function aiSdkProviderOptions(
  modelRef: Model.Ref,
  setting: ModelSettings,
): AiSdkProvider.OptionsProp {
  return {
    [modelRef.developerId]: {
      // TODO: AI SDK types do not support explicit undefineds as they expect
      // JSONValue only, which excludes undefined. However AI SDK's provider
      // options includes undefineds, so we have to cast here for now.
      ...(aiSdkReasoningForModel(
        modelRef,
        setting.reasoning,
      ) as AiSdkProvider.Options),
    },
  };
}
