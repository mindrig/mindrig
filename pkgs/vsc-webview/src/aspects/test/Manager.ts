import { Run } from "@wrkspc/core/run";
import { Test } from "@wrkspc/core/test";
import { Field, State } from "enso";
import { nanoid } from "nanoid";
import { useAppState } from "../app/state/Context";
import { useAssessment } from "../assessment/Context";
import { AssessmentManager } from "../assessment/Manager";
import { RunProviderManager } from "../run/ProviderManager";
import { useStoreProp } from "../store/Context";
import { useMemoWithProps } from "../utils/hooks";
import { buildTestAppState, TestAppState } from "./appState";

export namespace TestManager {
  export interface UseProps {
    testField: Field<Test>;
  }

  export interface Props {
    testField: Field<Test>;
    testAppState: State<TestAppState>;
    assessment: AssessmentManager;
    streamingStoreState: useStoreProp.State<"playground.streaming">;
  }
}

export class TestManager {
  static use(props: TestManager.UseProps) {
    const { testField } = props;
    const { assessment } = useAssessment();

    const streamingStoreState = useStoreProp("global", "playground.streaming");

    const testId = testField.$.id.useValue();
    const testAppState = useAppState(`tests.${testId}`, buildTestAppState);

    const manager = useMemoWithProps(
      {
        testField,
        testAppState,
        assessment,
        streamingStoreState,
      },
      (props) => new TestManager(props),
      [],
    );

    return manager;
  }

  #testField;
  #testAppState;
  #assessment;
  #streamingStoreState;

  constructor(props: TestManager.Props) {
    this.#testField = props.testField;
    this.#testAppState = props.testAppState;
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
    this.#testAppState.$.runId.set(runId);
  }

  useRunId() {
    return this.#testAppState.$.runId.useValue();
  }

  useRunProvider(): RunProviderManager {
    const runId = this.useRunId();
    const runProvider = RunProviderManager.use(runId);
    return runProvider;
  }
}
