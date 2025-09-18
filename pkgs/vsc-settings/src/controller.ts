import { VscController } from "@wrkspc/vsc-controller";
import * as vscode from "vscode";
import { VscSettings } from "./settings";

export namespace VscSettingsController {
  export interface Props {
    onUpdate: OnUpdate;
  }

  export type OnUpdate = (settings: VscSettings) => void;
}

export class VscSettingsController extends VscController {
  //#region Static

  private static readonly section = "mindrig";

  //#endregion

  //#region Instance

  #props: VscSettingsController.Props;

  constructor(props: VscSettingsController.Props) {
    super();
    this.#props = props;

    this.register(
      vscode.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration(VscSettingsController.section))
          this.#triggerUpdate();
      }),
    );
  }

  //#endregion

  //#region Main

  #triggerUpdate() {
    this.#props.onUpdate(this.settings);
  }

  get settings(): VscSettings {
    const config = vscode.workspace.getConfiguration(
      VscSettingsController.section,
    );
    return {
      playground: config.get("playground"),
    };
  }

  //#endregion
}
