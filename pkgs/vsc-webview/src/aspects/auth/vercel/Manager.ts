import { useAppState } from "@/aspects/app/state/Context";
import { MessagesContext, useMessages } from "@/aspects/message/Context";
import { useMemoWithProps } from "@/aspects/util/hooks";
import { AuthGateway } from "@wrkspc/core/auth";
import { Form, State } from "enso";
import { useRef } from "react";
import { AuthAppState, buildAuthAppState } from "../appState";

export namespace AuthVercelManager {
  export interface UseProps {
    gatewayState: State<AuthGateway.Vercel> | State<null>;
  }

  export interface Props {
    sendMessage: MessagesContext.SendMessage;
    gatewayState: State<AuthGateway.Vercel> | State<null>;
    authAppState: State<AuthAppState>;
    form: Form<FormValues>;
  }

  export interface FormValues {
    key: string;
  }
}

export class AuthVercelManager {
  static use(props: AuthVercelManager.UseProps) {
    const { gatewayState } = props;
    const { sendMessage, useListen } = useMessages();

    const { appState } = useAppState();
    const authAppState = appState.$.auth.pave(
      buildAuthAppState(gatewayState.value),
    );

    const form = Form.use<AuthVercelManager.FormValues>({ key: "" }, []);

    const vercelManager = useMemoWithProps(
      { sendMessage, gatewayState, authAppState, form },
      (props) => new AuthVercelManager(props),
      [],
    );

    const prevGatewayRef = useRef<AuthGateway.Vercel | undefined | null>(
      gatewayState.value,
    );
    gatewayState.useWatch(
      (gateway) => {
        if (gateway === prevGatewayRef.current) return;
        if (prevGatewayRef.current === undefined) {
          prevGatewayRef.current = gateway;
          return;
        }

        if (gateway?.error) vercelManager.#setError(gateway.error);
        else if (gateway) vercelManager.#setProfile(gateway.maskedKey);
      },
      [prevGatewayRef, vercelManager],
    );

    return vercelManager;
  }

  #sendMessage: MessagesContext.SendMessage;
  #gatewayState: State<AuthGateway.Vercel> | State<null>;
  #authAppState: State<AuthAppState>;
  #form: Form<AuthVercelManager.FormValues>;

  #resolveSave: (() => void) | null = null;

  constructor(props: AuthVercelManager.Props) {
    this.#sendMessage = props.sendMessage;
    this.#gatewayState = props.gatewayState;
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

  logout() {
    this.#sendMessage({ type: "auth-client-logout" });
  }

  clearForm() {
    this.#form.set({ key: "" });
  }

  get form() {
    return this.#form;
  }

  save(key: string) {
    const promise = new Promise<void>((resolve) => {
      this.#resolveSave = resolve;

      this.#sendMessage({
        type: "auth-client-vercel-gateway-set",
        payload: key,
      });
    });
    return promise;
  }

  #setProfile(maskedKey: string) {
    this.#authAppState.set({
      type: "profile",
      maskedKey,
    });
  }

  #setError(error: string) {
    const discriminated = this.#authAppState.discriminate("type");
    if (discriminated.discriminator === "profile")
      this.#form.$.key.addError(error);
  }

  useError() {
    return this.#gatewayState.useCompute((gateway) => gateway?.error, []);
  }
}
