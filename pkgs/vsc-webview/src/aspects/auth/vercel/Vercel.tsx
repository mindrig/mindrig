import { useMessages } from "@/aspects/message/Context";
import { AuthGateway } from "@wrkspc/core/auth";
import { never } from "alwaysly";
import { Form, State } from "enso";
import { useMemo, useRef } from "react";
import { AuthVercelForm } from "./Form";
import { AuthVercelProfile } from "./Profile";
import { authVercelStatechart } from "./statechart";

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
  const form = Form.use<AuthVercel.FormValues>({ key: "" }, []);
  const { sendMessage } = useMessages();

  const statechart = useMemo(() => {
    const clearKey = () => form.set({ key: "" });

    const statechart = authVercelStatechart.host({
      form: {
        "-> clear!": clearKey,
      },
      formSubmitting: {
        "valid() -> clear!": clearKey,
      },
      profileErrored: {
        "revalidate() -> revalidate!": () =>
          sendMessage({ type: "auth-client-vercel-gateway-revalidate" }),
      },
    });

    const gateway = gatewayState.value;
    if (gateway?.error)
      statechart.send.error("-> profileErrored", {
        maskedKey: gateway.maskedKey,
        error: gateway.error,
      });
    else if (gateway)
      statechart.send.valid("-> profile", {
        maskedKey: gateway.maskedKey,
      });
    else statechart.send.missing();

    return statechart;
  }, [form, sendMessage]);

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

      if (gateway?.error)
        if (statechart.in("formSubmitting"))
          statechart.send.error("-> formErrored", {
            error: gateway.error,
          });
        else
          statechart.send.error("-> profileErrored", {
            maskedKey: gateway.maskedKey,
            error: gateway.error,
          });
      else if (gateway)
        statechart.send.valid("-> profile", {
          maskedKey: gateway.maskedKey,
        });
    },
    [prevGatewayRef, statechart],
  );

  switch (statechart.state.name) {
    case "pending":
      never();

    case "profile":
    case "profileErrored":
    case "profileValidating":
      return (
        <AuthVercelProfile statechart={statechart} state={statechart.state} />
      );

    case "form":
    case "formSubmitting":
    case "formErrored":
      return (
        <AuthVercelForm
          form={form}
          statechart={statechart}
          state={statechart.state}
        />
      );

    default:
      statechart.state satisfies never;
      never();
  }
}
