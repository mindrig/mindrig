import * as vscode from "vscode";

export interface SettingsManagerEvents {
  onSettingsChanged: (settings: any) => void;
}

export class SettingsManager {
  //#region Static

  private static readonly configSection = "mindcontrol";

  //#endregion

  //#region Instance

  #disposables: vscode.Disposable[] = [];

  constructor(events: SettingsManagerEvents) {
    this.#events = events;

    this.#disposables.push(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(SettingsManager.configSection))
          this.#handleConfigurationChange();
      }),
    );

    this.#handleConfigurationChange();
  }

  dispose() {
    this.#disposables.forEach((d) => d.dispose());
    this.#disposables = [];
  }

  //#endregion

  //#region Events

  #events: SettingsManagerEvents;

  #handleConfigurationChange() {
    this.#events.onSettingsChanged(this.settings);
  }

  //#endregion

  //#region Settings

  get settings() {
    const config = vscode.workspace.getConfiguration(
      SettingsManager.configSection,
    );

    return {
      exampleSetting: config.get("exampleSetting", "default value"),
      enableFileTracking: config.get("enableFileTracking", true),
      showFileContent: config.get("showFileContent", true),
      autoSaveIndicator: config.get("autoSaveIndicator", true),
    };
  }

  //#endregion
}
