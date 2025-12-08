import { Auth, AuthMessage } from "@wrkspc/core/auth";
import { log } from "smollog";
import * as vscode from "vscode";
import { Manager } from "../manager/Manager.js";
import { MessagesManager } from "../message/Manager.js";
import { SecretsManager } from "../secret/Manager.js";
import { Secret } from "../secret/types.js";

export namespace AuthManager {
  export interface Props {
    secrets: SecretsManager;
    messages: MessagesManager;
  }

  export type EventMap = {
    "gateway-resolve": Auth.GatewayValue;
  };
}

export class AuthManager extends Manager<AuthManager.EventMap> {
  #state: Auth;
  #secrets: SecretsManager;
  #messages: MessagesManager;

  constructor(parent: Manager, props: AuthManager.Props) {
    super(parent);

    this.#state = { gateway: null };
    this.#secrets = props.secrets;
    this.#messages = props.messages;

    this.#secrets.on(this, "update.auth-vercel-gateway-key", this.#onVercelKey);

    this.#secrets
      .get("auth-vercel-gateway-key")
      .then(this.#onVercelKey.bind(this));

    this.#messages.listen(this, "auth-client-logout", this.#onLogout);

    this.#messages.listen(
      this,
      "auth-client-vercel-gateway-clear",
      this.#onVercelGatewayClear,
    );

    this.#messages.listen(
      this,
      "auth-client-vercel-gateway-set",
      this.#onVercelGatewaySet,
    );

    this.#messages.listen(this, "auth-client-vercel-gateway-revalidate", () =>
      this.#validate(this.#state.gateway),
    );
  }

  get state(): Auth {
    return this.#state;
  }

  logOut() {
    log.debug("User logged out");

    authSecrets.forEach(this.#secrets.clear.bind(this.#secrets));
    this.#reportLoggedIn(false);
    this.#onVercelKey(undefined);
  }

  #validate(gateway: Auth.GatewayValue) {
    this.emit("gateway-resolve", gateway);
  }

  #onVercelKey(key: Secret.Value) {
    // NOTE: When adding multiple gateways, add status to gateway value,
    // allowing to wait until the secret is fetched before using it.

    const gateway: Auth.GatewayValue = key?.trim()
      ? {
          type: "vercel",
          maskedKey: SecretsManager.maskKey(key),
        }
      : null;

    if (gateway)
      log.debug("Got Vercel gateway key", { maskedKey: gateway?.maskedKey });
    else log.debug("No Vercel gateway key found");

    // Report logged out if no gateway credentials found
    if (!gateway) this.#reportLoggedIn(false);

    // Instead of applying the state directly, we first trigger an event,
    // allowing models manager to verify the key before applying it.
    this.#validate(gateway);
  }

  #onVercelGatewaySet(message: AuthMessage.ClientVercelGatewaySet) {
    this.#secrets.set("auth-vercel-gateway-key", message.payload);
  }

  #onVercelGatewayClear(_message?: AuthMessage.ClientVercelGatewayClear) {
    this.#secrets.clear("auth-vercel-gateway-key");
  }

  async registerGatewayResponse(gateway: Auth.GatewayValue) {
    this.#state = { ...this.#state, gateway };

    const error = this.#state.gateway?.error;
    const loggedIn = !error;

    log.debug("Auth state updated", { loggedIn: !error, error });

    await this.#reportLoggedIn(loggedIn);

    this.#messages.send({
      type: "auth-server-update",
      payload: this.#state,
    });
  }

  #reportLoggedIn(loggedIn: boolean) {
    return vscode.commands.executeCommand(
      "setContext",
      "mindrig.auth.loggedIn",
      loggedIn,
    );
  }

  #onLogout() {
    this.#onVercelGatewayClear();
  }
}

const authSecrets: Secret.Key[] = ["auth-vercel-gateway-key"];
