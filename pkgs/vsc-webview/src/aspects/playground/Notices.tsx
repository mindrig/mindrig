import { Block, Notice } from "@wrkspc/ui";
import { AuthErrors } from "../auth/Errors";
import { useClientState } from "../client/StateContext";
import { PlaygroundWelcomeNotice } from "./WelcomeNotice";

export namespace PlaygroundNotices {
  export interface Props {}
}

export function PlaygroundNotices(props: PlaygroundNotices.Props) {
  const clientState = useClientState();
  const parseError = clientState.$.playground.$.parseError.useValue();

  return (
    <Block dir="y" pad={[false, "medium", "medium"]}>
      <AuthErrors />

      {parseError && (
        <Notice color="error" compact>
          File parse error: {parseError}
        </Notice>
      )}

      <PlaygroundWelcomeNotice />
    </Block>
  );
}
