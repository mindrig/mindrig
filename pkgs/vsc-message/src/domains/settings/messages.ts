import type { VscSettings } from "@wrkspc/vsc-settings";

export type VscMessageSettings =
  | VscMessageSettings.Updated
  | VscMessageSettings.GetStreamingPreference
  | VscMessageSettings.SetStreamingPreference
  | VscMessageSettings.StreamingPreference;

export namespace VscMessageSettings {
  export type Type =
    | "settings-updated"
    | "settings-streaming-get"
    | "settings-streaming-set"
    | "settings-streaming-state";

  export interface Updated {
    type: "settings-updated";
    payload: VscSettings;
  }

  export interface GetStreamingPreference {
    type: "settings-streaming-get";
    payload?: undefined;
  }

  export interface SetStreamingPreference {
    type: "settings-streaming-set";
    payload: {
      enabled: boolean;
    };
  }

  export interface StreamingPreference {
    type: "settings-streaming-state";
    payload: {
      enabled: boolean;
    };
  }
}
