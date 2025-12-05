import { useApp } from "@/aspects/app/Context";
import { LayoutSection } from "@/aspects/layout/Section";
import { useMessages } from "@/aspects/message/Context";
import { Block, Button, Errors, Icon, Label, textCn } from "@wrkspc/ds";
import iconRegularTimes from "@wrkspc/icons/svg/regular/times.js";
import { State } from "enso";
import { AuthAppState } from "../appState";
import { AuthVercelManager } from "./Manager";

export namespace AuthVercelProfile {
  export interface Props {
    authAppState: State<AuthAppState.Profile>;
    vercelManager: AuthVercelManager;
    // statechart: AuthVercelStatechart.Instance;
    // state: superstate.State<
    //   AuthVercelStatechart,
    //   "profile" | "profileValidating" | "profileErrored"
    // >;
  }
}

export function AuthVercelProfile(props: AuthVercelProfile.Props) {
  const { authAppState, vercelManager } = props;
  const { navigateTo } = useApp();
  const { sendMessage } = useMessages();
  const error = vercelManager.useError();

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
            {/* {state.context.maskedKey ?? "••••"} */}
          </p>
        </Block>

        {/* {state.name === "profileValidating" && (
          <p className="text-sm text-blue-600">Validating...</p>
        )} */}

        {error && (
          <div>
            <Errors errors={error} />

            <Button
              size="small"
              style="transparent"
              onClick={() => {
                // TODO: Add send function to state with all available events.
                // statechart.send.revalidate("-> profileValidating", {
                //   maskedKey: state.context.maskedKey,
                // });

                sendMessage({
                  type: "auth-client-vercel-gateway-revalidate",
                });
              }}
              // isDisabled={!!statechart.in("profileValidating")}
            >
              Retry
            </Button>
          </div>
        )}

        <Block align>
          <Button onClick={() => vercelManager.edit()} size="small">
            Update
          </Button>

          <Button onClick={() => vercelManager.logout()} style="label">
            Log out
          </Button>
        </Block>
      </Block>
    </LayoutSection>
  );
}
