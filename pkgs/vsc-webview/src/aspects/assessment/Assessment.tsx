import { PlaygroundState } from "@wrkspc/core/playground";
import { State } from "enso";
import { Setups } from "../setup/Setups";
import { Tests } from "../test/Tests";
import { Tools } from "../tools/Tools";
import { AssessmentProvider } from "./Context";
import { AssessmentLoading } from "./Loading";
import { AssessmentManager } from "./Manager";

export { AssessmentComponent as Assessment };

export namespace AssessmentComponent {
  export interface Props {
    promptState: State<PlaygroundState.Prompt>;
  }
}

function AssessmentComponent(props: AssessmentComponent.Props) {
  const { promptState } = props;
  const assessment = AssessmentManager.use(promptState);

  if (!assessment) return <AssessmentLoading />;

  return (
    <AssessmentProvider assessment={assessment}>
      <Setups
        setupsField={assessment.assessmentForm.$.setups}
        setupsAppState={assessment.assessmentAppState.$.setups}
      />

      <Tools field={assessment.assessmentForm.$.tools} />

      <Tests field={assessment.assessmentForm.$.tests} />
    </AssessmentProvider>
  );
}
