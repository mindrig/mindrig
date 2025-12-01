import { Run } from "@wrkspc/core/run";
import { State } from "enso";
import { useEffect, useState } from "react";
import { MessagesContext } from "../message/Context";
import { useRuns } from "./RunsContext";
import { RunsManager } from "./RunsManager";
import { RunAppState } from "./appState";

export namespace RunManager {
  export interface Props {
    runAppState: State<RunAppState>;
    sendMessage: MessagesContext.SendMessage;
  }

  export interface Meta {
    pending: boolean;
    error: string | null;
  }
}

export class RunManager {
  #runAppState: State<RunAppState>;
  #sendMessage: MessagesContext.SendMessage;

  constructor(props: RunManager.Props) {
    this.#runAppState = props.runAppState;
    this.#sendMessage = props.sendMessage;
  }

  stopRun() {
    if (!RunsManager.running(this.#runAppState.$.run.value)) return;

    this.#sendMessage({
      type: "run-client-stop",
      payload: {
        runId: this.#runAppState.$.run.$.id.value,
        reason: "Run stopped",
      },
    });
  }

  useMeta(): RunManager.Meta {
    const pending = this.usePending();
    const error = this.useError();
    return { pending, error };
  }

  usePending(): boolean {
    return this.#runAppState.useCompute(
      (state) => state.run.status === "initialized",
      [],
    );
  }

  useError(): string | null {
    return this.#runAppState.$.run.useCompute(
      (run) => (run.status === "error" ? run.error : null),
      [],
    );
  }

  get runId(): Run.Id {
    return this.#runAppState.$.run.$.id.value;
  }

  useInit(): Run.Init {
    return this.#runAppState.$.run.$.init.useValue();
  }

  useRunning(): boolean {
    const { runs } = useRuns();
    return runs.useRunning(this.runId);
  }

  useEndedAt() {
    return this.#runAppState.$.run.useCompute((run) => {
      if ("endedAt" in run) return run.endedAt;
    }, []);
  }

  useStreaming() {
    return this.#runAppState.$.run.$.init.$.streaming.useValue();
  }

  useCreatedAt() {
    return this.#runAppState.$.run.$.createdAt.useValue();
  }

  useRunningTimeMs() {
    const running = this.useRunning();
    const createdAt = this.#runAppState.$.run.$.createdAt.useValue();
    const endedAt = this.useEndedAt();
    const [runningTimeMs, setRunningTime] = useState(
      this.#calculateRunningTime(createdAt, endedAt),
    );

    useEffect(() => {
      if (!running)
        return setRunningTime(this.#calculateRunningTime(createdAt, endedAt));
      const interval = setInterval(
        () => setRunningTime(this.#calculateRunningTime(createdAt, undefined)),
        100,
      );
      return () => clearInterval(interval);
    }, [this, running, createdAt]);

    return runningTimeMs;
  }

  useRunningTimeSec() {
    const runningTimeMs = this.useRunningTimeMs();
    return Math.floor(runningTimeMs / 100) / 10;
  }

  useShowDetails() {
    return this.#runAppState.$.ui.$.showDetails.useValue();
  }

  toggleShowDetails(showInit: boolean) {
    this.#runAppState.$.ui.$.showDetails.set(showInit);
  }

  #calculateRunningTime(
    createdAt: number,
    endedAt: number | undefined,
  ): number {
    return (endedAt ?? Date.now()) - createdAt;
  }
}
