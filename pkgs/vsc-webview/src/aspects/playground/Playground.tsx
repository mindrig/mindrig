import { Blueprint } from "../blueprint/Blueprint";
import { BlueprintEmpty } from "../blueprint/Empty";
import { useClientState } from "../client/StateContext";
import { FileHeader } from "../file/Header";
import { PlaygroundEmpty } from "./Empty";
import { PlaygroundNotices } from "./Notices";

export function Playground() {
  const clientState = useClientState();
  const decomposedFile = clientState.$.playground.$.file.useDecomposeNullish();
  const decomposedPrompt =
    clientState.$.playground.$.prompt.useDecomposeNullish();

  return (
    <>
      {decomposedFile.value ? (
        <>
          <FileHeader fileState={decomposedFile.state} />

          <PlaygroundNotices />

          {decomposedPrompt.value ? (
            <Blueprint promptState={decomposedPrompt.state} />
          ) : (
            <BlueprintEmpty />
          )}
        </>
      ) : (
        <PlaygroundEmpty />
      )}
    </>
  );
}
