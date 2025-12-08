import { Button, Errors } from "@wrkspc/ds";
import { useModelsMap } from "../model/MapContext";
import { pageHrefs } from "../page/route";
import { useAuth } from "./Context";

export namespace AuthErrors {
  export interface Props {}
}

export function AuthErrors(props: AuthErrors.Props) {
  const { authState } = useAuth();
  const { modelsPayload: payload, sources } = useModelsMap();
  const hasGateway = authState.$.gateway.useCompute((gateway) => !!gateway, []);

  if (!payload || payload?.status !== "error") return null;

  return (
    <Errors
      errors={payload.message}
      style="notice"
      actions={
        <Button size="xsmall" href={pageHrefs.auth()}>
          Fix key
        </Button>
      }
    />
  );
}
