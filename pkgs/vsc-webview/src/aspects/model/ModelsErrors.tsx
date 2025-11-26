import { Button } from "@wrkspc/ds";
import { useAuth } from "../auth/Context";
import { pageHrefs } from "../page/route";
import { useModelsMap } from "./MapContext";

export namespace ModelsError {
  export interface Props {}
}

export function ModelsError(props: ModelsError.Props) {
  const { authState } = useAuth();
  const { modelsPayload: payload, sources } = useModelsMap();
  const hasGateway = authState.$.gateway.useCompute((gateway) => !!gateway, []);

  if (!payload || payload?.status !== "error") return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-red-600 px-4 py-3 text-sm text-red-400 md:flex-row md:items-center md:justify-between">
      <div>{payload.message}</div>

      <div className="flex gap-2">
        {hasGateway && (
          <Button
            size="xsmall"
            style="transparent"
            onClick={sources.gateway.refresh}
            isPending={sources.gateway.waiting}
          >
            Retry
          </Button>
        )}

        <Button size="xsmall" href={pageHrefs.auth()}>
          {hasGateway ? "Update" : "Set up"}
        </Button>
      </div>
    </div>
  );
}
