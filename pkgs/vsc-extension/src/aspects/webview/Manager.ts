import { Manager } from "@/aspects/manager/Manager.js";
import { logsVerbositySettingToLevel } from "@wrkspc/core/log";
import { Page } from "@wrkspc/core/page";
import { log } from "smollog";
import * as vscode from "vscode";
import { AttachmentsManager } from "../attachment/AttachementsManager";
import { AuthManager } from "../auth/Manager";
import { ClientStateManager } from "../client/StateManager";
import { DatasetsManager } from "../dataset/DatasetsManager";
import { DatasourcesManager } from "../datasource/DatasourcesManager";
import { DevManager } from "../dev/Manager";
import { EditorManager } from "../editor/Manager";
import { MessagesManager } from "../message/Manager";
import { ModelsDotdevManager } from "../model/DotdevManager";
import { ModelsGatewayManager } from "../model/GatewayManager";
import { PageManager } from "../page/Manager";
import { PlaygroundManager } from "../playground/Manager";
import { PromptsManager } from "../prompt/Manager";
import { RunsManager } from "../run/RunsManager";
import { SecretsManager } from "../secret/Manager";
import { SettingsManager } from "../settings/Manager";
import { StoreManager } from "../store/Manager";
import { WebviewHtmlManager } from "./HtmlManager";

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
  #dev: DevManager;
  #settings: SettingsManager;
  #secrets: SecretsManager;
  #auth: AuthManager;
  #clientState: ClientStateManager;
  #gatewayModels: ModelsGatewayManager;
  #dotdevModels: ModelsDotdevManager;
  #store: StoreManager;
  #editor: EditorManager;
  #prompts: PromptsManager;
  #playground: PlaygroundManager;
  #runs: RunsManager;
  #datasets: DatasetsManager;
  #datasources: DatasourcesManager;
  #attachments: AttachmentsManager;
  #page: PageManager;
  #html: WebviewHtmlManager;

  constructor(parent: Manager, props: WebviewManager.Props) {
    super(parent);

    this.#view = props.view;
    this.#context = props.context;

    this.#messages = new MessagesManager(this, {
      webview: this.#view.webview,
    });

    this.#store = new StoreManager(this, {
      context: this.#context,
      messages: this.#messages,
    });

    this.#dev = new DevManager(this, {
      messages: this.#messages,
      store: this.#store,
    });

    this.#settings = new SettingsManager(this, {
      messages: this.#messages,
    });

    this.#setupLogging();

    this.#secrets = new SecretsManager(this, {
      storage: this.#context.secrets,
    });

    this.#auth = new AuthManager(this, {
      secrets: this.#secrets,
      messages: this.#messages,
    });

    this.#gatewayModels = new ModelsGatewayManager(this, {
      auth: this.#auth,
      secrets: this.#secrets,
      messages: this.#messages,
    });

    this.#dotdevModels = new ModelsDotdevManager(this, {
      messages: this.#messages,
    });

    this.#editor = new EditorManager(this);

    this.#prompts = new PromptsManager(this);

    this.#playground = new PlaygroundManager(this, {
      messages: this.#messages,
      editor: this.#editor,
      prompts: this.#prompts,
      store: this.#store,
    });

    this.#datasets = new DatasetsManager(this, {
      messages: this.#messages,
    });

    this.#attachments = new AttachmentsManager(this, {
      messages: this.#messages,
    });

    this.#datasources = new DatasourcesManager(this, {
      datasets: this.#datasets,
    });

    this.#runs = new RunsManager(this, {
      messages: this.#messages,
      secrets: this.#secrets,
      attachments: this.#attachments,
      datasources: this.#datasources,
      settings: this.#settings,
    });

    this.#page = new PageManager(this, {
      messages: this.#messages,
    });

    this.#clientState = new ClientStateManager(this, {
      auth: this.#auth,
      settings: this.#settings,
      playground: this.#playground,
    });

    this.#html = new WebviewHtmlManager(this, {
      extensionUri: this.#context.extensionUri,
      webview: this.#view.webview,
      state: this.#clientState,
    });

    this.#messages.listen(this, "client-client-ready", this.#onReady);
  }

  async #onReady() {
    // Up to this point any extension messages where queued, now we can
    // process them.
    await this.#messages.ready();
  }

  navigateTo(page: Page) {
    this.#messages.send({ type: "client-server-navigate", payload: page });
  }

  logOut() {
    this.#auth.logOut();
  }

  runPrompt() {
    this.#runs.trigger();
  }

  #setupLogging() {
    let levelSetting = this.#settings.state.dev?.logsVerbosity;
    log.level = logsVerbositySettingToLevel(levelSetting);

    this.#settings.on(this, "update", (settings) => {
      const nextLevel = logsVerbositySettingToLevel(
        settings.dev?.logsVerbosity,
      );
      log.level = nextLevel;
    });
  }
}
