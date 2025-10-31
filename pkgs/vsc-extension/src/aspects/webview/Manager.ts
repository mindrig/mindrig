import { Manager } from "@/aspects/manager/Manager.js";
import { Page } from "@wrkspc/core/page";
import * as vscode from "vscode";
import { AttachmentsManager } from "../attachment/Manager";
import { AuthManager } from "../auth/Manager";
import { ClientStateManager } from "../client/StateManager";
import { DatasetsManager } from "../dataset/Manager";
import { EditorManager } from "../editor/Manager";
import { MessagesManager } from "../message/Manager";
import { ModelsDotdevManager } from "../model/DotdevManager";
import { ModelsGatewayManager } from "../model/GatewayManager";
import { PageManager } from "../page/Manager";
import { PlaygroundManager } from "../playground/Manager";
import { PromptsManager } from "../prompt/Manager";
import { RunManager } from "../run/Manager";
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
  #run: RunManager;
  #datasets: DatasetsManager;
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

    this.#store = new StoreManager(this, {
      context: this.#context,
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

    this.#run = new RunManager(this, {
      messages: this.#messages,
      secrets: this.#secrets,
    });

    this.#datasets = new DatasetsManager(this, {
      messages: this.#messages,
    });

    this.#attachments = new AttachmentsManager(this, {
      messages: this.#messages,
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
    this.#run.trigger();
  }
}
