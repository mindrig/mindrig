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

  // Calculate if we need to show the source component.
  const showSourceSetting = clientState.$.settings.useCompute(
    (settings) => !!settings?.playground?.showSource,
    [],
  );
  const pinnedButNotCursorPrompt = clientState.$.playground.useCompute(
    (playground) =>
      playground.prompt?.prompt &&
      playground.pin &&
      "reason" in playground.prompt &&
      playground.prompt.reason !== "cursor",
    [],
  );
  const pinnedDraftPrompt = clientState.$.playground.useCompute(
    (playground) =>
      playground.prompt?.prompt &&
      playground.pin &&
      playground.prompt.type === "draft",
    [],
  );
  const showSource =
    showSourceSetting || pinnedButNotCursorPrompt || pinnedDraftPrompt;

  useEffect(() => {
    log.debug("Displaying prompt:", promptId);
  }, [promptId]);

  return (
    <BlueprintProvider promptState={promptState}>
      {showSource && (
        <PromptSource promptState={promptState} draft={!!pinnedDraftPrompt} />
      )}

      <Assessment
        promptState={promptState}
        // NOTE: The key is required to reset the component state.
        key={promptId}
      />
    </BlueprintProvider>
  );
}
