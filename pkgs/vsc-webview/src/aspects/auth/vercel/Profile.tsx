import { useApp } from "@/aspects/app/Context";
import { useMessages } from "@/aspects/message/Context";
import { Block, Button, Errors, Label, textCn } from "@wrkspc/ds";
import { State } from "enso";
import { AuthAppState } from "../appState";
import { AuthVercelLayout } from "./Layout";
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
  const maskedKey = authAppState.$.maskedKey.useValue();

  return (
    <AuthVercelLayout>
      <Block dir="y" pad background="primary" border>
        <Block dir="y" size="small">
          <Label>API key</Label>

          <p className={textCn({ mono: true })}>{maskedKey ?? "••••"}</p>

          {error && <Errors errors={error} />}
        </Block>

        <Block align>
          <Button onClick={() => vercelManager.edit()} size="small">
            Update
          </Button>

          <Button onClick={() => vercelManager.logout()} style="label">
            Clear
          </Button>
        </Block>
      </Block>
    </AuthVercelLayout>
  );
}
