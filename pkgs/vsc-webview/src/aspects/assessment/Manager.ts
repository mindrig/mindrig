import { Assessment, buildAssessment } from "@wrkspc/core/assessment";
import { PlaygroundState } from "@wrkspc/core/playground";
import { Field, State } from "enso";
import { useAppState } from "../app/state/Context";
import { useStoreField } from "../store/Context";
import { useMemoWithProps } from "../utils/hooks";
import { AssessmentAppState, buildAssessmentAppState } from "./appState";

export namespace AssessmentManager {
  export interface Props {
    assessmentField: Field<Assessment>;
    assessmentAppState: State<AssessmentAppState>;
    promptState: State.Immutable<PlaygroundState.Prompt>;
  }
}

export class AssessmentManager {
  static use(
    promptState: State<PlaygroundState.Prompt>,
  ): AssessmentManager | undefined {
    const promptId = promptState.$.promptId.useValue();

    const assessmentField = useStoreField(
      "workspace",
      `playground.assessments.${promptId}`,
      buildAssessment,
    );

    const assessmentAppState = useAppState(
      `assessments.${promptId}`,
      buildAssessmentAppState,
    );

    const manager = useMemoWithProps(
      {
        assessmentField,
        assessmentAppState,
        promptState,
      },
      ({ assessmentField, ...props }) =>
        assessmentField && new AssessmentManager({ ...props, assessmentField }),
      [],
    );

    return manager;
  }

  #assessmentField;
  #assessmentAppState;
  #promptState;

  constructor(props: AssessmentManager.Props) {
    this.#assessmentField = props.assessmentField;
    this.#assessmentAppState = props.assessmentAppState;
    this.#promptState = props.promptState;
  }

  get assessmentForm(): Field<Assessment> {
    return this.#assessmentField;
  }

  get assessmentAppState(): State<AssessmentAppState> {
    return this.#assessmentAppState;
  }

  get promptState(): State.Immutable<PlaygroundState.Prompt> {
    return this.#promptState;
  }
}
