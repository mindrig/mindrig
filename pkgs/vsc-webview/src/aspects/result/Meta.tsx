import { Result } from "@wrkspc/core/result";
import { Block, Tabs } from "@wrkspc/ui";
import { State } from "enso";
import { useResult } from "./Context";
import { ResultInitPreview } from "./InitPreview";
import { ResultRequest } from "./Request";
import { ResultResponse } from "./Response";
import { ResultUsage } from "./Usage";

const SHOW_RESULT_INIT = false;

export namespace ResultMeta {
  export interface Props {
    resultState: State<Result>;
  }
}

export function ResultMeta(props: ResultMeta.Props) {
  const { resultState } = props;
  const { requestState, responseState, usageState } =
    useMetaStates(resultState);
  const { resultAppState } = useResult();
  const tab = resultAppState.$.tab.useValue();

  if (!tab) return null;

  return (
    <Block pad={["small", "medium", "medium"]}>
      <Tabs
        size="xsmall"
        value={tab}
        items={[
          {
            id: "request",
            label: "Request",
            content: <ResultRequest state={requestState} />,
          },
          {
            id: "response",
            label: "Response",
            content: <ResultResponse state={responseState} />,
          },
          {
            id: "usage",
            label: "Usage",
            content: <ResultUsage usageState={usageState} />,
          },
        ]}
        onChange={(nextTab) => resultAppState.$.tab.set(nextTab)}
        collapsible={{ id: undefined }}
      />

      {/* {SHOW_RESULT_INIT && <ResultInitPreview resultInitState={initState} />}

      <ResultRequest state={requestState} />

      <ResultResponse state={responseState} />

      <ResultUsage usageState={usageState} /> */}
    </Block>
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
