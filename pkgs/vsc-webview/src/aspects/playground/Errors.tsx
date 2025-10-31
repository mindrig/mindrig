import { Button } from "@wrkspc/ds";
import { useAuth } from "../auth/Context";
import { useModelsMap } from "../model/MapContext";
import { pageHrefs } from "../page/route";

export namespace PlaygroundErrors {
  export interface Props {}
}

export function PlaygroundErrors(props: PlaygroundErrors.Props) {
  const { auth } = useAuth();
  const { payload, sources } = useModelsMap();

  if (!payload || payload?.status !== "error") return null;

  return (
    <div className="flex flex-col gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 md:flex-row md:items-center md:justify-between">
      <div>{payload.message}</div>

      <div className="flex gap-2">
        {auth.gateway && (
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
          {auth.gateway ? "Update" : "Set up"}
        </Button>
      </div>
    </div>
  );
}
