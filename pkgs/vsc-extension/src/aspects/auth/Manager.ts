import { Auth } from "@wrkspc/core/auth";
import { VscMessageAuth } from "@wrkspc/core/message";
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
    "gateway-response": Auth.GatewayValue;
  };
}

export class AuthManager extends Manager<AuthManager.EventMap> {
  #state: Auth;
  #secrets: SecretsManager;
  #messages: MessagesManager;

  constructor(parent: Manager, props: AuthManager.Props) {
    super(parent);

    this.#state = { gateway: undefined };
    this.#secrets = props.secrets;
    this.#messages = props.messages;

    this.#secrets.on(this, "update.auth-vercel-gateway-key", this.#onVercelKey);

    this.#secrets
      .get("auth-vercel-gateway-key")
      .then(this.#onVercelKey.bind(this));

    this.on(this, "gateway-response", this.#onGatewayResponse);

    this.#messages.listen(
      this,
      "auth-wv-vercel-gateway-clear",
      this.#onVercelGatewayClear,
    );

    this.#messages.listen(
      this,
      "auth-wv-vercel-gateway-set",
      this.#onVercelGatewaySet,
    );

    this.#messages.listen(
      this,
      "auth-wv-vercel-gateway-revalidate",
      this.#validate,
    );
  }

  get state(): Auth {
    return this.#state;
  }

  logOut() {
    authSecrets.forEach(this.#secrets.clear.bind(this.#secrets));
  }

  #validate() {
    this.emit("gateway-resolve", this.#state.gateway);
  }

  #onVercelKey(key: Secret.Value) {
    // NOTE: When adding multiple gateways, add status to gateway value,
    // allowing to wait until the secret is fetched before using it.

    const gateway: Auth.GatewayValue = key?.trim()
      ? {
          type: "vercel",
          maskedKey: "****" + key.slice(-4),
        }
      : null;

    // Instead of applying the state directly, we first trigger an event,
    // allowing models manager to verify the key before applying it.
    this.#validate();
  }

  #onVercelGatewaySet(message: VscMessageAuth.WebviewVercelGatewaySet) {
    this.#secrets.set("auth-vercel-gateway-key", message.payload);
  }

  #onVercelGatewayClear(_message: VscMessageAuth.WebviewVercelGatewayClear) {
    this.#secrets.clear("auth-vercel-gateway-key");
  }

  #onGatewayResponse(gateway: Auth.GatewayValue) {
    this.#state = { ...this.#state, gateway };

    this.#messages.send({
      type: "auth-ext-update",
      payload: this.#state,
    });
  }
}

const authSecrets: Secret.Key[] = ["auth-vercel-gateway-key"];
