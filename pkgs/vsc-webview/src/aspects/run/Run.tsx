import iconRegularBroomWide from "@wrkspc/icons/svg/regular/broom-wide.js";
import iconRegularEyeSlash from "@wrkspc/icons/svg/regular/eye-slash.js";
import iconRegularEye from "@wrkspc/icons/svg/regular/eye.js";
import { Button } from "@wrkspc/ui";
import { LayoutBlock } from "../layout/Block";
import { LayoutSection } from "../layout/Section";
import { Results } from "../result/Results";
import { useTest } from "../test/Context";
import { RunProvider } from "./Context";
import { RunDetailsPreview } from "./DetailsPreview";
import { RunError } from "./Error";
import { RunManager } from "./Manager";
import { RunPending } from "./Pending";

const SHOW_RUN_DETAILS_SECTION = false;

export namespace RunComponent {
  export interface Props {
    run: RunManager;
  }
}

export function RunComponent(props: RunComponent.Props) {
  const { run } = props;
  const { pending, error } = run.useMeta();
  const showDetails = run.useShowDetails();
  const { test } = useTest();
  const running = test.useRunning();

  return (
    <RunProvider run={run}>
      {SHOW_RUN_DETAILS_SECTION && (
        <LayoutSection
          header="Run"
          actions={
            <>
              <Button
                size="xsmall"
                style="label"
                icon={showDetails ? iconRegularEyeSlash : iconRegularEye}
                color="secondary"
                onClick={() => run.toggleShowDetails(!showDetails)}
              >
                Details
              </Button>

              <Button
                style="label"
                size="xsmall"
                color="secondary"
                icon={iconRegularBroomWide}
                onClick={() => test.clearRun()}
                isDisabled={running}
              />
            </>
          }
        >
          {showDetails && (
            <LayoutBlock
              size="small"
              bordered
              onClose={() => run.toggleShowDetails(false)}
            >
              <RunDetailsPreview />
            </LayoutBlock>
          )}
        </LayoutSection>
      )}

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
