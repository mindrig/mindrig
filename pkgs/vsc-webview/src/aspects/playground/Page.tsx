import { AppLayout } from "../app/Layout";
import { Blueprint } from "../blueprint/Blueprint";
import { FileHeader } from "../file/Header";
import { usePlayground } from "./Context";
import { PlaygroundErrors } from "./Errors";

export function PlaygroundPage() {
  const {
    playground: { file, prompt },
  } = usePlayground();
  return (
    <AppLayout>
      <div className="flex flex-col gap-2">
        <PlaygroundErrors />

        {file && <FileHeader file={file} />}

        {file && prompt && <Blueprint file={file} prompt={prompt} />}
      </div>
    </AppLayout>
  );
}
