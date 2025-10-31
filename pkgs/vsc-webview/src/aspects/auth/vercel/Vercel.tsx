import { useMessages } from "@/aspects/message/Context";
import { AuthGateway } from "@wrkspc/core/auth";
import { never } from "alwaysly";
import { Form } from "enso";
import { useEffect, useMemo, useRef } from "react";
import { AuthVercelForm } from "./Form";
import { AuthVercelProfile } from "./Profile";
import { authVercelStatechart } from "./statechart";

export namespace AuthVercel {
  export interface Props {
    gateway: AuthGateway.Vercel | null;
  }

  export interface FormValues {
    key: string;
  }
}

export function AuthVercel(props: AuthVercel.Props) {
  const { gateway } = props;
  const form = Form.use<AuthVercel.FormValues>({ key: "" }, []);
  const { send } = useMessages();

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
          send({ type: "auth-client-vercel-gateway-revalidate" }),
      },
    });

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
  }, [form, send]);

  const prevGateway = useRef<AuthGateway.Vercel | undefined | null>(gateway);
  useEffect(() => {
    if (gateway === prevGateway.current) return;

    if (prevGateway.current === undefined) {
      prevGateway.current = gateway;
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
      statechart.send.valid("-> profile", { maskedKey: gateway.maskedKey });
  }, [gateway, prevGateway, statechart]);

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
