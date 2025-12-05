export interface SetupAppState {
  settingsTab: SetupAppState.SettingsTab | null;
}

export namespace SetupAppState {
  export type SettingsTab =
    | "output-limits"
    | "creativity-and-sampling"
    | "repetition-control"
    | "reproducibility"
    | "reasoning";
}

export function buildSetupAppState(): SetupAppState {
  return {
    settingsTab: null,
  };
}

export const DEFAULT_SETUP_SETTINGS_TAB: SetupAppState.SettingsTab =
  "output-limits";
