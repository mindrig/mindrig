import { Results } from "../result/Results";
import { RunProvider } from "./Context";
import { RunError } from "./Error";
import { RunInitPreview } from "./InitPreview";
import { RunManager } from "./Manager";
import { RunPending } from "./Pending";

export namespace RunComponent {
  export interface Props {
    run: RunManager;
  }
}

export function RunComponent(props: RunComponent.Props) {
  const { run } = props;
  const { pending, error } = run.useMeta();

  return (
    <RunProvider run={run}>
      <RunInitPreview />

      {pending ? (
        <RunPending />
      ) : error ? (
        <RunError error={error} />
      ) : (
        <Results />
      )}
    </RunProvider>
  );
}
