import { PlaygroundState } from "@wrkspc/core/playground";
import { State } from "enso";
import { useEffect } from "react";
import { log } from "smollog";
import { Assessment } from "../assessment/Assessment";
import { useClientState } from "../client/StateContext";
import { PromptSource } from "../prompt/Source";
import { BlueprintProvider } from "./Context";

export namespace Blueprint {
  export interface Props {
    promptState: State<PlaygroundState.Prompt>;
  }
}

export function Blueprint(props: Blueprint.Props) {
  const { promptState } = props;
  const clientState = useClientState();
  const promptId = promptState.$.prompt.$.id.useValue();
  const showSource = clientState.$.settings.useCompute(
    (settings) => !!settings?.playground?.showSource,
    [],
  );

  useEffect(() => {
    log.debug("Displaying prompt:", promptId);
  }, [promptId]);

  return (
    <BlueprintProvider manager={{}} promptState={promptState}>
      {showSource && <PromptSource promptState={promptState} />}

      <Assessment
        promptState={promptState}
        // NOTE: The key is required to reset the component state.
        key={promptId}
      />
    </BlueprintProvider>
  );
}
