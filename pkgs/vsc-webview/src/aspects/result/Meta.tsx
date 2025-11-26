import { Result } from "@wrkspc/core/result";
import { State } from "enso";
import { ResultInitPreview } from "./InitPreview";
import { ResultRequest } from "./Request";
import { ResultResponse } from "./Response";
import { ResultUsage } from "./Usage";

export namespace ResultMeta {
  export interface Props {
    resultState: State<Result>;
  }
}

export function ResultMeta(props: ResultMeta.Props) {
  const { resultState } = props;
  const { initState, requestState, responseState, usageState } =
    useMetaStates(resultState);

  return (
    <div>
      <ResultInitPreview resultInitState={initState} />

      <ResultRequest state={requestState} />

      <ResultResponse state={responseState} />

      <ResultUsage usageState={usageState} />
    </div>
  );
}

namespace ResolveMetaStates {
  export interface Result {
    initState: ResultInitPreview.Props["resultInitState"];
    requestState: ResultRequest.Props["state"];
    responseState: ResultResponse.Props["state"];
    usageState: ResultUsage.Props["usageState"];
  }
}

function useMetaStates(state: State<Result>): ResolveMetaStates.Result {
  const initState = state.$.init;
  const nullState = State.use(null, []);

  let requestState: ResultRequest.Props["state"] = nullState;
  let responseState: ResultResponse.Props["state"] = nullState;
  let usageState: ResultUsage.Props["usageState"] = nullState;

  const discriminatedState = state.useDiscriminate("status");
  switch (discriminatedState.discriminator) {
    case "error":
    case "success":
      requestState = discriminatedState.state.$.request;
      responseState = discriminatedState.state.$.response;
      usageState = discriminatedState.state.$.usage;
      break;

    case "running":
      usageState = discriminatedState.state.$.usage;
      break;
  }

  return { initState, requestState, responseState, usageState };
}
