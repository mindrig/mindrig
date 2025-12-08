import { Block, Errors } from "@wrkspc/ui";
import { AuthErrors } from "../auth/Errors";
import { useClientState } from "../client/StateContext";

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
        <Errors errors={`File parse error: ${parseError}`} style="notice" />
      )}
    </Block>
  );
}
