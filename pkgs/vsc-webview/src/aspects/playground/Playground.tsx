import { Blueprint } from "../blueprint/Blueprint";
import { BlueprintEmpty } from "../blueprint/Empty";
import { FileHeader } from "../file/Header";
import { PlaygroundEmpty } from "./Empty";
import { PlaygroundErrors } from "./Errors";
import { usePlaygroundState } from "./StateContext";

export function Playground() {
  const { file, prompt } = usePlaygroundState();

  return (
    <>
      <PlaygroundErrors />

      {file ? (
        <>
          <FileHeader file={file} />

          {prompt ? <Blueprint prompt={prompt} /> : <BlueprintEmpty />}
        </>
      ) : (
        <PlaygroundEmpty />
      )}
    </>
  );
}
