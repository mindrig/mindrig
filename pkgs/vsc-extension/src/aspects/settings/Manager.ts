import { Manager } from "@/aspects/manager/Manager.js";
import { Settings } from "@wrkspc/core/settings";
import * as vscode from "vscode";
import { MessagesManager } from "../message/Manager";

export namespace SettingsManager {
  export interface Props {
    messages: MessagesManager;
  }

  export type EventMap = {
    update: Settings;
  };
}

export class SettingsManager extends Manager<SettingsManager.EventMap> {
  private static readonly section = "mindrig";

  #messages: MessagesManager;

  constructor(parent: Manager, props: SettingsManager.Props) {
    super(parent);

    this.#messages = props.messages;

    this.register(
      vscode.workspace.onDidChangeConfiguration(this.#onChange.bind(this)),
    );
  }

  get state(): Settings {
    const config = vscode.workspace.getConfiguration(SettingsManager.section);
    return {
      playground: config.get("playground"),
    };
  }

  #onChange(event: vscode.ConfigurationChangeEvent) {
    if (!event.affectsConfiguration(SettingsManager.section)) return;

    this.emit("update", this.state);

    this.#messages.send({
      type: "settings-ext-update",
      payload: this.state,
    });
  }
}
