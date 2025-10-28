import { AppLayout } from "../app/Layout";
import { Blueprint } from "../blueprint/Blueprint";
import { BlueprintEmpty } from "../blueprint/Empty";
import { FileHeader } from "../file/Header";
import { usePlayground } from "./Context";
import { PlaygroundEmpty } from "./Empty";
import { PlaygroundErrors } from "./Errors";

export function PlaygroundPage() {
  const {
    playground: { file, prompt },
  } = usePlayground();
  return (
    <AppLayout>
      <div className="flex flex-col gap-2">
        <PlaygroundErrors />

        {file ? (
          <>
            <FileHeader file={file} />

            {prompt ? (
              <Blueprint file={file} prompt={prompt} />
            ) : (
              <BlueprintEmpty />
            )}
          </>
        ) : (
          <PlaygroundEmpty />
        )}
      </div>
    </AppLayout>
  );
}
