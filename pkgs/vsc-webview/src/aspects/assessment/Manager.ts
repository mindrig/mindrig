import { Assessment, buildAssessment } from "@wrkspc/core/assessment";
import { PlaygroundState } from "@wrkspc/core/playground";
import { Form, State } from "enso";
import { useMemo } from "react";
import { useClientStoreState } from "../client/StoreContext";
import { useMemoWithProps } from "../utils/hooks";
import {
  AssessmentClientState,
  buildAssessmentClientState,
} from "./clientState";

export namespace AssessmentManager {
  export interface Props {
    assessmentForm: Form<Assessment>;
    assessmentClientState: State<AssessmentClientState>;
    promptState: State.Immutable<PlaygroundState.Prompt>;
  }
}

export class AssessmentManager {
  static use(promptState: State<PlaygroundState.Prompt>) {
    const promptId = promptState.$.promptId.useValue();
    const fileId = promptState.$.fileId.useValue();

    const assessmentStoreState = useClientStoreState(
      `playground.assessments.${promptId}`,
    );

    const ref = useMemo<PlaygroundState.Ref>(
      () => ({ v: 1, promptId, fileId }),
      [promptId, fileId],
    );

    // Set up assessment form.
    const initialAssessment = useMemo(
      () => assessmentStoreState[0]?.assessment || buildAssessment(),
      // NOTE: We only want to set the initial assessment once, without reacting
      // to further changes in the client store.
      [],
    );
    const assessmentForm = Form.use<Assessment>(initialAssessment, [promptId]);

    const assessmentClientState = State.use(buildAssessmentClientState(), [
      promptId,
    ]);

    // Sync form changes back to the client store.
    assessmentForm.useWatch(
      (assessment) =>
        assessmentStoreState[1]((prevPromptStore) => ({
          ...prevPromptStore,
          v: 1,
          ref,
          assessment,
        })),
      [ref, initialAssessment, assessmentStoreState[1]],
    );

    const manager = useMemoWithProps(
      {
        assessmentForm,
        assessmentClientState,
        promptState,
      },
      (props) => new AssessmentManager(props),
      [],
    );

    return manager;
  }

  #assessmentForm;
  #assessmentClientState;
  #promptState;

  constructor(props: AssessmentManager.Props) {
    this.#assessmentForm = props.assessmentForm;
    this.#assessmentClientState = props.assessmentClientState;
    this.#promptState = props.promptState;
  }

  get assessmentForm(): Form<Assessment> {
    return this.#assessmentForm;
  }

  get assessmentClientState(): State<AssessmentClientState> {
    return this.#assessmentClientState;
  }

  get promptState(): State.Immutable<PlaygroundState.Prompt> {
    return this.#promptState;
  }
}
