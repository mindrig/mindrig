import type { VscSettings } from "@wrkspc/vsc-settings";

export type VscMessageSettings =
  | VscMessageSettings.Update
  | VscMessageSettings.StreamingGet
  | VscMessageSettings.StreamingSet
  | VscMessageSettings.StreamingState;

export namespace VscMessageSettings {
  export interface Update {
    type: "settings-update";
    payload: VscSettings;
  }

  export interface StreamingGet {
    type: "settings-streaming-get";
    payload?: undefined;
  }

  export interface StreamingSet {
    type: "settings-streaming-set";
    payload: { enabled: boolean };
  }

  export interface StreamingState {
    type: "settings-streaming-state";
    payload: { enabled: boolean };
  }
}
