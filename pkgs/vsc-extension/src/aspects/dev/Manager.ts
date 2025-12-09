import { Manager } from "@/aspects/manager/Manager.js";
import { log } from "smollog";
import * as vscode from "vscode";
import { WebSocket } from "ws";
import { MessagesManager } from "../message/Manager";
import { SecretsManager } from "../secret/Manager";
import { StoreManager } from "../store/Manager";

const AUTO_RELOAD_HOST = "localhost";
const AUTO_RELOAD_PORT = 3192;

export namespace DevManager {
  export interface Props {
    messages: MessagesManager;
    store: StoreManager;
    secrets: SecretsManager;
  }
}

export class DevManager extends Manager {
  #messages: MessagesManager;
  #store: StoreManager;
  #secrets: SecretsManager;
  #autoReloadWs: WebSocket | null = null;

  constructor(parent: Manager | null, props: DevManager.Props) {
    super(parent);

    this.#messages = props.messages;
    this.#store = props.store;
    this.#secrets = props.secrets;

    if (process.env.MINDRIG_DEV_AUTO_RELOAD === "true") this.enableAutoReload();
  }

  async clearState() {
    await Promise.all([
      this.#store.clearAll(),
      this.#secrets.clearAll(),
      this.#messages.send({ type: "dev-server-clear-app-state" }),
    ]);
  }

  enableAutoReload() {
    if (this.#autoReloadWs) return;

    log.debug("Enabling auto-reload");

    const ws = new WebSocket(`ws://${AUTO_RELOAD_HOST}:${AUTO_RELOAD_PORT}`);

    ws.on("open", () =>
      log.debug(
        `Auto-reload WebSocket connected to ws://${AUTO_RELOAD_HOST}:${AUTO_RELOAD_PORT} successfully`,
      ),
    );

    ws.on("message", (data) => {
      try {
        const message: unknown = JSON.parse(String(data));
        if (
          typeof message === "object" &&
          message &&
          "type" in message &&
          message.type === "reload"
        ) {
          log.debug("Reloading VS Code window");
          vscode.commands.executeCommand("workbench.action.reloadWindow");
        }
      } catch (error) {
        log.warn("Failed to parse auto-reload message", error);
      }
    });

    ws.on("error", (error) => {
      log.warn("Auto-reload WebSocket error", error);
    });

    ws.on("close", () => {
      log.debug("Auto-reload WebSocket disconnected");
      this.#autoReloadWs = null;
    });

    this.#autoReloadWs = ws;
    this.register({ dispose: () => this.#closeAutoReloadWs() });
  }

  disableAutoReload() {
    log.debug("Disabling auto-reload");
    this.#closeAutoReloadWs();
  }

  #closeAutoReloadWs() {
    if (!this.#autoReloadWs) return;
    this.#autoReloadWs.close();
    this.#autoReloadWs = null;
  }
}
