import { Button } from "@wrkspc/ds";
import { Checkbox } from "@wrkspc/form";
import { useAssessment } from "../assessment/Context";
import { Results } from "../result/Results";
import { useTest } from "./Context";

export namespace TestRun {
  export interface Props {}
}

export function TestRun(props: TestRun.Props) {
  const {} = props;
  const { assessment } = useAssessment();
  const { test } = useTest();
  const submitting = assessment.assessmentForm.submitting;

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Button
            type="submit"
            size="small"
            onClick={() => test.startRun()}
            isDisabled={submitting}
            // disabled={submitting || !canRunPrompt}
          >
            {submitting ? "Running..." : "Run Prompt"}
          </Button>

          {submitting && (
            <Button
              style="transparent"
              size="small"
              onClick={() => {
                // TODO:
              }}
              // disabled={stopDisabled}
            >
              Stop
            </Button>
          )}
        </div>

        <Checkbox
          label="Stream output"
          value={test.streaming}
          onChange={test.toggleStreaming.bind(assessment)}
          size="small"
        />

        {/* {hasResultsOrError && ( */}
        <Button
          style="label"
          size="small"
          onClick={() => {
            // TODO: onClear
          }}
          // disabled={runInFlight}
        >
          Clear
        </Button>
        {/* )} */}

        {/* <AssessmentResultsProvider value={resultsContextValue}> */}
        <Results />
        {/* </AssessmentResultsProvider> */}

        {/* {executionState.error && (
        <div className="space-y-2">
          <h5 className="text-sm font-medium">Error</h5>
          <div className="p-3 rounded border">
            <pre className="text-sm whitespace-pre-wrap">
              {executionState.error}
            </pre>
          </div>
        </div>
      )} */}
      </div>
    </>
  );
}
