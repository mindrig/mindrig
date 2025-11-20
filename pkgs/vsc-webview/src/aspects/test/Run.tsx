import { Button } from "@wrkspc/ds";
import { Checkbox } from "@wrkspc/form";
import { Results } from "../result/Results";
import { RunProvider } from "../run/Context";
import { useTest } from "./Context";

export function TestRunComponent() {
  const { test } = useTest();
  const running = test.useRunning();
  const run = test.useRun();

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="small"
            onClick={() => test.startRun()}
            isDisabled={running}
          >
            {running ? "Running..." : "Run Prompt"}
          </Button>

          {run && running && (
            <Button
              style="transparent"
              size="small"
              onClick={() => run.stopRun()}
            >
              Stop
            </Button>
          )}

          <Checkbox
            label="Stream output"
            value={test.streaming}
            onChange={(enabled) => test.setStreaming(enabled)}
            size="small"
          />

          {run && (
            <Button
              style="label"
              size="small"
              onClick={() => test.clearRun()}
              isDisabled={running}
            >
              Clear
            </Button>
          )}
        </div>

        {run && (
          <RunProvider run={run}>
            <Results />
          </RunProvider>
        )}
      </div>
    </>
  );
}
