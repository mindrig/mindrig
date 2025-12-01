import {
  AttachmentMessage,
  AttachmentRequest,
  buildAttachmentRequestId,
} from "@wrkspc/core/attachment";
import { Run } from "@wrkspc/core/run";
import { Store } from "@wrkspc/core/store";
import { Test } from "@wrkspc/core/test";
import { always } from "alwaysly";
import { Field, State } from "enso";
import { log } from "smollog";
import { useAppState } from "../app/state/Context";
import { useAssessment } from "../assessment/Context";
import { AssessmentManager } from "../assessment/Manager";
import {
  MessagesContext,
  useListenMessage,
  useMessages,
} from "../message/Context";
import { RunManager } from "../run/Manager";
import { useRuns } from "../run/RunsContext";
import { RunsManager } from "../run/RunsManager";
import { useStorePropState } from "../store/Context";
import { useMemoWithProps } from "../util/hooks";
import { buildTestAppState, TestAppState } from "./appState";

export namespace TestManager {
  export interface UseProps {
    testField: Field<Test>;
  }

  export interface Props {
    testField: Field<Test>;
    testAppState: State<TestAppState>;
    assessment: AssessmentManager;
    streamingStoreState: State<Store["playground.streaming"] | null>;
    runs: RunsManager;
    sendMessage: MessagesContext.SendMessage;
  }
}

export class TestManager {
  static use(props: TestManager.UseProps) {
    const { testField } = props;
    const { runs } = useRuns();
    const { assessment } = useAssessment();
    const { sendMessage } = useMessages();

    const streamingStoreState = useStorePropState(
      "global",
      "playground.streaming",
    );

    const testId = testField.$.id.useValue();
    const { appState } = useAppState();
    const testAppState = appState.$.tests.at(testId).pave(buildTestAppState());

    const test = useMemoWithProps(
      {
        testField,
        testAppState,
        assessment,
        streamingStoreState,
        runs,
        sendMessage,
      },
      (props) => new TestManager(props),
      [],
    );

    useListenMessage(
      "attachment-server-read",
      test.#onAttachmentRead.bind(test),
      [test],
    );

    useListenMessage("run-server-trigger", test.startRun.bind(test), [test]);

    return test;
  }

  #testField;
  #testAppState;
  #assessment;
  #streamingStoreState;
  #runs;
  #sendMessage: MessagesContext.SendMessage;
  #pendingAttachmentRequests: Set<AttachmentRequest.Id> = new Set();

  constructor(props: TestManager.Props) {
    this.#testField = props.testField;
    this.#testAppState = props.testAppState;
    this.#assessment = props.assessment;
    this.#streamingStoreState = props.streamingStoreState;
    this.#runs = props.runs;
    this.#sendMessage = props.sendMessage;
  }

  get #streaming(): boolean {
    return !!this.#streamingStoreState.value;
  }

  useStreaming(): boolean {
    return this.#streamingStoreState.useCompute((value) => !!value, []);
  }

  setStreaming(enabled: boolean) {
    this.#streamingStoreState.set(enabled);
  }

  useRunId() {
    return this.#testAppState.$.runId.useValue();
  }

  get #runId(): Run.Id | null {
    return this.#testAppState.$.runId.value;
  }

  // NOTE: We need a separate running hook, as run manager might not be defined
  // where we use it.
  useRunning(): boolean {
    const runId = this.useRunId();
    return this.#runs.useRunning(runId);
  }

  useRun(): RunManager | null {
    const runId = this.useRunId();
    return this.#runs.useRun(runId);
  }

  startRun() {
    if (this.#runId) this.clearRun();

    const init = this.#runInit;
    const runId = this.#runs.startRun(init);
    this.#testAppState.$.runId.set(runId);
  }

  clearRun() {
    const runId = this.#runId;
    always(runId);

    this.#runs.clearRun(runId);
    this.#testAppState.$.runId.set(null);
  }

  get #runInit(): Run.Init {
    const prompt = this.#assessment.promptState.$.prompt.value;
    const assessment = this.#assessment.assessmentForm.value;
    const test = this.#testField.value;

    return {
      prompt,
      setups: assessment.setups,
      tools: assessment.tools,
      datasources: test.datasources,
      attachments: test.attachments,
      streaming: this.#streaming,
    };
  }

  attachFile() {
    const requestId = buildAttachmentRequestId();
    log.debug("Requested attachments", requestId);

    this.#sendMessage({
      type: "attachment-client-request",
      payload: {
        requestId,
        modalities: ["text", "image", "audio", "video", "pdf"],
      },
    });

    this.#pendingAttachmentRequests.add(requestId);
  }

  #onAttachmentRead(message: AttachmentMessage.ServerRead) {
    const { payload } = message;
    const { requestId } = payload;
    if (this.#pendingAttachmentRequests.has(requestId))
      switch (payload.status) {
        case "ok":
          log.debug("Adding attachment", payload);
          payload.data.forEach((attachment) =>
            this.#testField.$.attachments.push(attachment),
          );
          break;

        case "error":
          log.debug("Attachments failed to read", payload);
        // TODO: Handle error
      }

    this.#pendingAttachmentRequests.delete(requestId);
  }
}
