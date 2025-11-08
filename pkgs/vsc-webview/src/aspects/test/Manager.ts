import { Run } from "@wrkspc/core/run";
import { Test } from "@wrkspc/core/test";
import { Field, State } from "enso";
import { nanoid } from "nanoid";
import { useAssessment } from "../assessment/Context";
import { AssessmentManager } from "../assessment/Manager";
import { useServerStoreState } from "../server/StoreContext";
import { useMemoWithProps } from "../utils/hooks";
import { buildTestClientState, TestClientState } from "./clientState";

export namespace TestManager {
  export interface UseProps {
    testField: Field<Test>;
  }

  export interface Props {
    testField: Field<Test>;
    testClientState: State<TestClientState>;
    assessment: AssessmentManager;
    streamingStoreState: useServerStoreState.State<"playground.streaming">;
  }
}

export class TestManager {
  static use(props: TestManager.UseProps) {
    const { testField } = props;
    const { assessment } = useAssessment();

    const streamingStoreState = useServerStoreState(
      "global",
      "playground.streaming",
    );

    const testClientState = State.use(buildTestClientState(), [testField]);

    const manager = useMemoWithProps(
      {
        testField,
        testClientState,
        assessment,
        streamingStoreState,
      },
      (props) => new TestManager(props),
      [],
    );

    return manager;
  }

  #testField;
  #testClientState;
  #assessment;
  #streamingStoreState;

  constructor(props: TestManager.Props) {
    this.#testField = props.testField;
    this.#testClientState = props.testClientState;
    this.#assessment = props.assessment;
    this.#streamingStoreState = props.streamingStoreState;
  }

  get streaming(): boolean {
    return !!this.#streamingStoreState[0];
  }

  toggleStreaming() {
    const enabled = this.#streamingStoreState[0];
    this.#streamingStoreState[1](!enabled);
  }

  startRun() {
    const runId: Run.Id = nanoid();
    this.#testClientState.$.runId.set(runId);
  }
}
