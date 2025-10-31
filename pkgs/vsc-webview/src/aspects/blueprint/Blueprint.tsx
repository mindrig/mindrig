import { PlaygroundState } from "@wrkspc/core/playground";
import { Assessment } from "../assessment/Assessment";
import { PromptSource } from "../prompt/Source";
import { useSettings } from "../settings/Context";
import { BlueprintProvider } from "./Context";

export namespace Blueprint {
  export interface Props {
    prompt: PlaygroundState.Prompt;
  }
}

export function Blueprint(props: Blueprint.Props) {
  const { prompt } = props;
  const { settings } = useSettings();

  return (
    <BlueprintProvider manager={{}}>
      {settings.playground?.showSource && <PromptSource prompt={prompt} />}

      <Assessment
        prompt={prompt}
        // NOTE: The key is required to reset the component state.
        key={prompt.promptId}
      />
    </BlueprintProvider>
  );
}
