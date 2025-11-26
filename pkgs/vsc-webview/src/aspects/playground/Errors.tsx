import { useClientState } from "../client/StateContext";
import { ModelsError } from "../model/ModelsErrors";

export namespace PlaygroundErrors {
  export interface Props {}
}

export function PlaygroundErrors(props: PlaygroundErrors.Props) {
  const clientState = useClientState();

  const parseError = clientState.$.playground.$.parseError.useValue();

  return (
    <div>
      <ModelsError />

      {parseError && (
        <div className="flex flex-col gap-2 rounded-lg border border-red-600 px-4 py-3 text-sm text-red-400 md:flex-row md:items-center md:justify-between">
          File parse error: {parseError}
        </div>
      )}
    </div>
  );
}
