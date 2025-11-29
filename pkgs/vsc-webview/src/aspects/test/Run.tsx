import { Button } from "@wrkspc/ds";
import { Checkbox } from "@wrkspc/ui";
import { LayoutSection } from "../layout/Section";
import { RunComponent } from "../run/Run";
import { useTest } from "./Context";
import { TestRunStarted } from "./RunStarted";

export function TestRunComponent() {
  const { test } = useTest();
  const running = test.useRunning();
  const run = test.useRun();
  const streaming = test.useStreaming();

  return (
    <>
      {run && (
        <LayoutSection
          actions={
            <Button
              style="label"
              size="xsmall"
              color="secondary"
              onClick={() => test.clearRun()}
              isDisabled={running}
            >
              Clear
            </Button>
          }
        >
          <RunComponent run={run} />
        </LayoutSection>
      )}

      <LayoutSection sticky="bottom">
        <div className="grid gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="submit"
                size="small"
                onClick={() => test.startRun()}
                isDisabled={running}
              >
                {running ? "Running..." : "Run Prompt"}
              </Button>

              <Checkbox
                label="Stream output"
                value={streaming}
                onChange={(enabled) => test.setStreaming(enabled)}
                size="small"
              />
            </div>

            {run && <TestRunStarted run={run} running={running} />}
          </div>
        </div>
      </LayoutSection>
    </>
  );
}
