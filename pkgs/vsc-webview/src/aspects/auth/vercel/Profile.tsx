import { useApp } from "@/aspects/app/Context";
import { LayoutSection } from "@/aspects/layout/Section";
import { useMessages } from "@/aspects/message/Context";
import { Block, Button, Errors, Icon, Label, textCn } from "@wrkspc/ds";
import iconRegularTimes from "@wrkspc/icons/svg/regular/times.js";
import { superstate } from "superstate";
import { AuthVercelStatechart } from "./statechart";

export namespace AuthVercelProfile {
  export interface Props {
    statechart: AuthVercelStatechart.Instance;
    state: superstate.State<
      AuthVercelStatechart,
      "profile" | "profileValidating" | "profileErrored"
    >;
  }
}

export function AuthVercelProfile(props: AuthVercelProfile.Props) {
  const { statechart, state } = props;
  const { navigateTo } = useApp();
  const { sendMessage } = useMessages();

  return (
    <LayoutSection
      header="Vercel Gateway"
      actions={
        <Icon
          id={iconRegularTimes}
          size="small"
          color="support"
          onClick={() => navigateTo({ type: "playground" })}
        />
      }
    >
      <Block dir="y" pad background="primary" border>
        <Block dir="y" size="small">
          <Label>Vercel Gateway API key</Label>

          <p className={textCn({ mono: true })}>
            {state.context.maskedKey ?? "••••"}
          </p>
        </Block>

        {state.name === "profileValidating" && (
          <p className="text-sm text-blue-600">Validating...</p>
        )}

        {state.name === "profileErrored" && (
          <div>
            <Errors errors={state.context.error} />

            <Button
              size="small"
              style="transparent"
              onClick={() => {
                // TODO: Add send function to state with all available events.
                statechart.send.revalidate("-> profileValidating", {
                  maskedKey: state.context.maskedKey,
                });

                sendMessage({
                  type: "auth-client-vercel-gateway-revalidate",
                });
              }}
              isDisabled={!!statechart.in("profileValidating")}
            >
              Retry
            </Button>
          </div>
        )}

        <Block align>
          <Button onClick={() => statechart.send.edit()} size="small">
            Update
          </Button>

          <Button onClick={() => statechart.send.clear()} style="label">
            Clear
          </Button>
        </Block>
      </Block>
    </LayoutSection>
  );
}
