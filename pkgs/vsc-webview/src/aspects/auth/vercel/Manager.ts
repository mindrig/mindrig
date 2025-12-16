import { MessagesContext, useMessages } from "@/aspects/message/Context";
import { useMemoWithProps } from "@/aspects/util/hooks";
import { Auth, AuthGateway } from "@wrkspc/core/auth";
import { never } from "alwaysly";
import { Form, State } from "enso";
import { useEffect, useRef } from "react";
import { log } from "smollog";
import { AuthAppState, buildAuthAppState } from "../appState";

export namespace AuthVercelManager {
  export interface UseProps {
    authState: State<Auth>;
  }

  export interface Props {
    sendMessage: MessagesContext.SendMessage;
    authState: State<Auth>;
    authAppState: State<AuthAppState>;
    form: Form<FormValues>;
  }

  export interface FormValues {
    key: string;
  }
}

export class AuthVercelManager {
  static use(props: AuthVercelManager.UseProps) {
    const { authState } = props;
    const { sendMessage } = useMessages();

    const authAppState = State.use(
      buildAuthAppState(authState.$.gateway.value),
      [],
    );

    useEffect(() => {
      log.debug("Initialized auth app state", authAppState.value);
    }, []);

    const form = Form.use<AuthVercelManager.FormValues>({ key: "" }, [], {
      validate(values) {
        if (!values.$.key.value.trim())
          values.$.key.addError("Please enter the key.");
      },
    });

    const vercelManager = useMemoWithProps(
      { sendMessage, authState, authAppState, form },
      (props) => new AuthVercelManager(props),
      [],
    );

    const prevGatewayRef = useRef<AuthGateway.Vercel | undefined | null>(
      authState.$.gateway.value,
    );
    authState.useWatch(
      (auth) => {
        // if (gateway === prevGatewayRef.current) return;
        const { gateway } = auth;
        if (prevGatewayRef.current === undefined) {
          prevGatewayRef.current = gateway;
          return;
        }

        vercelManager.#onGatewayUpdate(gateway);
      },
      [prevGatewayRef, vercelManager],
    );

    return vercelManager;
  }

  #sendMessage: MessagesContext.SendMessage;
  #authState: State<Auth>;
  #authAppState: State<AuthAppState>;
  #form: Form<AuthVercelManager.FormValues>;

  #savePromiseResolve: (() => void) | null = null;

  constructor(props: AuthVercelManager.Props) {
    this.#sendMessage = props.sendMessage;
    this.#authState = props.authState;
    this.#authAppState = props.authAppState;
    this.#form = props.form;
  }

  useDiscriminate() {
    return this.#authAppState.useDiscriminate("type");
  }

  edit() {
    this.clearForm();
    this.#authAppState.set({ type: "form" });
  }

  clearKey() {
    this.#sendMessage({ type: "auth-client-clear" });
    this.#authAppState.set({ type: "form" });
  }

  clearForm() {
    this.#form.set({ key: "" });
    // TODO: Add clearErrors method to Form in Enso
    this.#form.field.clearErrors();
    this.#form.commit();
  }

  get form() {
    return this.#form;
  }

  save(key: string) {
    const promise = new Promise<void>((resolve) => {
      this.#savePromiseResolve = resolve;

      this.#sendMessage({
        type: "auth-client-vercel-gateway-set",
        payload: key,
      });
    });
    return promise;
  }

  #resolveSave() {
    this.#savePromiseResolve?.();
    this.#savePromiseResolve = null;
  }

  #onGatewayUpdate(gateway: AuthGateway.Vercel | null) {
    const discriminated = this.#authAppState.discriminate("type");
    switch (discriminated.discriminator) {
      case "form":
        return this.#onFormGatewayUpdate(gateway, discriminated.state);

      case "profile":
        return this.#onProfileGatewayUpdate(gateway, discriminated.state);

      default:
        never(discriminated);
    }
  }

  #onFormGatewayUpdate(
    gateway: AuthGateway.Vercel | null,
    state: State<AuthAppState.Form>,
  ) {
    if (gateway?.error) {
      this.#form.$.key.clearErrors();
      this.#form.$.key.addError(gateway.error);
    } else if (gateway) this.#setProfile(gateway.maskedKey);
    else this.#setForm();

    this.#resolveSave();
  }

  #onProfileGatewayUpdate(
    gateway: AuthGateway.Vercel | null,
    state: State<AuthAppState.Profile>,
  ) {
    if (gateway === null) return this.#setForm();

    const { error, maskedKey } = gateway;
    state.set({ ...state.value, error, maskedKey });
  }

  #setForm() {
    this.#authAppState.set({ type: "form" });
  }

  #setProfile(maskedKey: string) {
    this.#authAppState.set({ type: "profile", maskedKey });
  }

  useError() {
    return this.#authState.$.gateway.useCompute(
      (gateway) => gateway?.error,
      [],
    );
  }
}
