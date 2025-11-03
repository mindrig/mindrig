import { Result } from "@wrkspc/core/result";
import { State } from "enso";
import { ResultInit } from "./Init";
import { ResultRequest } from "./Request";
import { ResultResponse } from "./Response";
import { ResultUsage } from "./Usage";

export namespace ResultMeta {
  export interface Props {
    state: State<Result>;
  }
}

export function ResultMeta(props: ResultMeta.Props) {
  const { state } = props;
  const { initState, requestState, responseState, usageState } =
    useMetaStates(state);

  return (
    <div>
      <ResultInit state={initState} />

      <ResultRequest state={requestState} />

      <ResultResponse state={responseState} />

      <ResultUsage state={usageState} />
    </div>
  );
}

namespace ResolveMetaStates {
  export interface Result {
    initState: ResultInit.Props["state"];
    requestState: ResultRequest.Props["state"];
    responseState: ResultResponse.Props["state"];
    usageState: ResultUsage.Props["state"];
  }
}

function useMetaStates(state: State<Result>): ResolveMetaStates.Result {
  const initState = state.$.init;
  const nullState = State.use(null, []);

  let requestState: ResultRequest.Props["state"] = nullState;
  let responseState: ResultResponse.Props["state"] = nullState;
  let usageState: ResultUsage.Props["state"] = nullState;

  const discriminatedState = state.useDiscriminate("status");
  switch (discriminatedState.discriminator) {
    case "error":
    case "complete":
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
