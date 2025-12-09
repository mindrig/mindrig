import { Block, Button, Errors, Label, textCn } from "@wrkspc/ds";
import { State } from "enso";
import { AuthAppState } from "../appState";
import { AuthVercelLayout } from "./Layout";
import { AuthVercelManager } from "./Manager";

export namespace AuthVercelProfile {
  export interface Props {
    authAppState: State<AuthAppState.Profile>;
    vercelManager: AuthVercelManager;
  }
}

export function AuthVercelProfile(props: AuthVercelProfile.Props) {
  const { authAppState, vercelManager } = props;
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
