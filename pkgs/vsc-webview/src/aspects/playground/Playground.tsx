import { Blueprint } from "../blueprint/Blueprint";
import { BlueprintEmpty } from "../blueprint/Empty";
import { useClientState } from "../client/StateContext";
import { FileHeader } from "../file/Header";
import { PlaygroundEmpty } from "./Empty";
import { PlaygroundErrors } from "./Errors";

export function Playground() {
  const state = useClientState();
  const decomposedFile = state.$.playground.$.file.useDecompose(
    (nextFile, prevFile) => !!nextFile !== !!prevFile,
    [],
  );
  const decomposedPrompt = state.$.playground.$.prompt.useDecompose(
    (nextFile, prevFile) => !!nextFile !== !!prevFile,
    [],
  );

  return (
    <>
      <PlaygroundErrors />

      {decomposedFile.value ? (
        <>
          <FileHeader fileState={decomposedFile.state} />

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
