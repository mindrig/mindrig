import { AuthGateway } from "@wrkspc/core/auth";
import { never } from "alwaysly";
import { State } from "enso";
import { AuthVercelForm } from "./Form";
import { AuthVercelManager } from "./Manager";
import { AuthVercelProfile } from "./Profile";

export namespace AuthVercel {
  export interface Props {
    gatewayState: State<AuthGateway.Vercel> | State<null>;
  }

  export interface FormValues {
    key: string;
  }
}

export function AuthVercel(props: AuthVercel.Props) {
  const { gatewayState } = props;
  const vercelManager = AuthVercelManager.use({ gatewayState });
  const discriminatedAppState = vercelManager.useDiscriminate();

  // const form = Form.use<AuthVercel.FormValues>({ key: "" }, []);
  // const { sendMessage } = useMessages();

  // const statechart = useMemo(() => {
  //   const clearKey = () => form.set({ key: "" });

  //   const statechart = authVercelStatechart.host({
  //     form: {
  //       "-> clear!": clearKey,
  //     },
  //     formSubmitting: {
  //       "valid() -> clear!": clearKey,
  //     },
  //     profileErrored: {
  //       "revalidate() -> revalidate!": () =>
  //         sendMessage({ type: "auth-client-vercel-gateway-revalidate" }),
  //     },
  //   });

  //   const gateway = gatewayState.value;
  //   if (gateway?.error)
  //     statechart.send.error("-> profileErrored", {
  //       maskedKey: gateway.maskedKey,
  //       error: gateway.error,
  //     });
  //   else if (gateway)
  //     statechart.send.valid("-> profile", {
  //       maskedKey: gateway.maskedKey,
  //     });
  //   else statechart.send.missing();

  //   return statechart;
  // }, [form, sendMessage, gatewayState]);

  // const prevGatewayRef = useRef<AuthGateway.Vercel | undefined | null>(
  //   gatewayState.value,
  // );
  // gatewayState.useWatch(
  //   (gateway) => {
  //     if (gateway === prevGatewayRef.current) return;

  //     if (prevGatewayRef.current === undefined) {
  //       prevGatewayRef.current = gateway;
  //       return;
  //     }

  //     if (gateway?.error)
  //       if (statechart.in("formSubmitting"))
  //         statechart.send.error("-> formErrored", {
  //           error: gateway.error,
  //         });
  //       else
  //         statechart.send.error("-> profileErrored", {
  //           maskedKey: gateway.maskedKey,
  //           error: gateway.error,
  //         });
  //     else if (gateway)
  //       statechart.send.valid("-> profile", {
  //         maskedKey: gateway.maskedKey,
  //       });
  //   },
  //   [prevGatewayRef, statechart],
  // );

  switch (discriminatedAppState.discriminator) {
    case "profile":
      return (
        <AuthVercelProfile
          authAppState={discriminatedAppState.state}
          vercelManager={vercelManager}
        />
      );

    case "form":
      return (
        <AuthVercelForm
          authAppState={discriminatedAppState.state}
          vercelManager={vercelManager}
        />
      );

    default:
      never(discriminatedAppState);
  }
}
