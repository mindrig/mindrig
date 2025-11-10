import { Button } from "@wrkspc/ds";
import { Checkbox } from "@wrkspc/form";
import { RunComponent } from "../run/Run";
import { useTest } from "./Context";

export function TestRunComponent() {
  const { test } = useTest();
  const running = test.useRunning();
  const run = test.useRun();
  const streaming = test.useStreaming();

  return (
    <>
      <div className="grid gap-3">
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
            value={streaming}
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

        {run && <RunComponent run={run} />}
      </div>
    </>
  );
}
