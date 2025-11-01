import { Assessment, buildAssessment } from "@wrkspc/core/assessment";
import {
  PlaygroundMap,
  PlaygroundState,
  playgroundStatePromptToRef,
} from "@wrkspc/core/playground";
import { Form, State } from "enso";
import { useMemo } from "react";
import { useClientStoreProp } from "../client/StoreContext";
import { UseStore, useStore } from "../store/Context";
import { AssessmentState, buildAssessmentState } from "./state";

export namespace AssessmentManager {
  export interface Props {
    form: Form<Assessment>;
    state: State<AssessmentState>;
    promptId: PlaygroundMap.PromptId;
    streamingEnabledState: UseStore.State<"playground.streaming">;
  }
}

export class AssessmentManager {
  static use(prompt: PlaygroundState.Prompt) {
    const streamingEnabled = useStore("global", "playground.streaming");
    const assessmentStoreState = useClientStoreProp(
      `playground.assessments.${prompt.promptId}`,
    );

    const ref = useMemo(
      () => playgroundStatePromptToRef(prompt),
      [prompt.promptId, prompt.fileId],
    );

    // Set up assessment form.
    const initialAssessment = useMemo(
      () => assessmentStoreState[0]?.assessment || buildAssessment(),
      // NOTE: We only want to set the initial assessment once, without reacting
      // to further changes in the client store.
      [],
    );
    const form = Form.use<Assessment>(initialAssessment, [prompt.promptId]);

    const state = State.use(buildAssessmentState(), [prompt.promptId]);

    // Sync form changes back to the client store.
    form.useWatch(
      (assessment) =>
        assessmentStoreState[1]((prevPromptStore) => ({
          ...prevPromptStore,
          v: 1,
          ref,
          assessment,
        })),
      [ref, initialAssessment, assessmentStoreState[1]],
    );

    const manager = useMemo(
      () =>
        new AssessmentManager({
          form,
          state,
          promptId: prompt.promptId,
          streamingEnabledState: streamingEnabled,
        }),
      [form, state, prompt.promptId, streamingEnabled],
    );

    return manager;
  }

  #form;
  #state;
  #promptId;
  #streamingEnabledState;

  constructor(props: AssessmentManager.Props) {
    this.#form = props.form;
    this.#state = props.state;
    this.#promptId = props.promptId;
    this.#streamingEnabledState = props.streamingEnabledState;
  }

  get form(): Form<Assessment> {
    return this.#form;
  }

  get state(): State<AssessmentState> {
    return this.#state;
  }

  get streamingEnabled(): boolean {
    return !!this.#streamingEnabledState[0];
  }

  toggleStreamingEnabled() {
    const enabled = this.#streamingEnabledState[0];
    this.#streamingEnabledState[1](!enabled);
  }
}
