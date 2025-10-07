import { Manager } from "@/aspects/manager/Manager.js";
import * as vscode from "vscode";
import { AuthManager } from "../auth/Manager";
import { MessagesManager } from "../message/Manager";
import { ModelsDotdevManager } from "../model/DotdevManager";
import { ModelsGatewayManager } from "../model/GatewayManager";
import { RunManager } from "../run/Manager";
import { SecretsManager } from "../secret/Manager";
import { SettingsManager } from "../settings/Manager";
import { WebviewHtmlManager } from "./HtmlManager";
import { WebviewStateManager } from "./StateManager";

export namespace WebviewManager {
  export interface Props {
    view: vscode.WebviewView;
    context: vscode.ExtensionContext;
  }
}

export class WebviewManager extends Manager {
  #view: vscode.WebviewView;
  #context: vscode.ExtensionContext;
  #messages: MessagesManager;
  #settings: SettingsManager;
  #secrets: SecretsManager;
  #auth: AuthManager;
  #state: WebviewStateManager;
  #gatewayModels: ModelsGatewayManager;
  #dotdevModels: ModelsDotdevManager;
  #run: RunManager;
  #html: WebviewHtmlManager;

  constructor(parent: Manager, props: WebviewManager.Props) {
    super(parent);

    this.#view = props.view;
    this.#context = props.context;

    this.#messages = new MessagesManager(this, {
      webview: this.#view.webview,
    });

    this.#secrets = new SecretsManager(this, {
      storage: this.#context.secrets,
    });

    this.#auth = new AuthManager(this, {
      secrets: this.#secrets,
      messages: this.#messages,
    });

    this.#settings = new SettingsManager(this, {
      messages: this.#messages,
    });

    this.#state = new WebviewStateManager(this, {
      auth: this.#auth,
      settings: this.#settings,
    });

    this.#gatewayModels = new ModelsGatewayManager(this, {
      auth: this.#auth,
      secrets: this.#secrets,
      messages: this.#messages,
    });

    this.#dotdevModels = new ModelsDotdevManager(this, {
      messages: this.#messages,
    });

    this.#run = new RunManager(this, {
      messages: this.#messages,
    });

    this.#html = new WebviewHtmlManager(this, {
      extensionUri: this.#context.extensionUri,
      webview: this.#view.webview,
      state: this.#state,
    });

    this.#messages.listen(this, "lifecycle-wv-ready", this.#onReady);
  }

  #onReady() {}
}
