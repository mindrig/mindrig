import { Assessment, buildAssessment } from "@wrkspc/core/assessment";
import { PlaygroundState } from "@wrkspc/core/playground";
import { Form, State } from "enso";
import { useMemo } from "react";
import { useClientStoreState } from "../client/StoreContext";
import { useServerStoreState } from "../server/StoreContext";
import { useMemoWithProps } from "../utils/hooks";
import { AssessmentState, buildAssessmentState } from "./state";

export namespace AssessmentManager {
  export interface Props {
    assessmentForm: Form<Assessment>;
    assessmentState: State<AssessmentState>;
    promptState: State.Immutable<PlaygroundState.Prompt>;
    streamingEnabledStoreState: useServerStoreState.State<"playground.streaming">;
  }
}

export class AssessmentManager {
  static use(promptState: State<PlaygroundState.Prompt>) {
    const promptId = promptState.$.promptId.useValue();
    const fileId = promptState.$.fileId.useValue();

    const streamingEnabledStoreState = useServerStoreState(
      "global",
      "playground.streaming",
    );
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

    const assessmentState = State.use(buildAssessmentState(), [promptId]);

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
        assessmentState,
        promptState,
        streamingEnabledStoreState,
      },
      (props) => new AssessmentManager(props),
      [],
    );

    return manager;
  }

  #assessmentForm;
  #assessmentState;
  #promptState;
  #streamingEnabledStoreState;

  constructor(props: AssessmentManager.Props) {
    this.#assessmentForm = props.assessmentForm;
    this.#assessmentState = props.assessmentState;
    this.#promptState = props.promptState;
    this.#streamingEnabledStoreState = props.streamingEnabledStoreState;
  }

  get assessmentForm(): Form<Assessment> {
    return this.#assessmentForm;
  }

  get assessmentState(): State<AssessmentState> {
    return this.#assessmentState;
  }

  get promptState(): State.Immutable<PlaygroundState.Prompt> {
    return this.#promptState;
  }

  get streamingEnabled(): boolean {
    return !!this.#streamingEnabledStoreState[0];
  }

  toggleStreamingEnabled() {
    const enabled = this.#streamingEnabledStoreState[0];
    this.#streamingEnabledStoreState[1](!enabled);
  }
}
