import { RunsAppState } from "@/aspects/run/runsAppState";
import { AssessmentAppState } from "../../assessment/appState";
import { TestAppState } from "../../test/appState";

export type StateStore = StateStore.Map<
  AssessmentAppState.Store & TestAppState.Store & RunsAppState.Store
>;

export namespace StateStore {
  export type Prop = keyof StateStore;

  export type Map<Type> = {
    [Prop in keyof Type]?: Type[Prop] | undefined;
  };

  export type Value<Prop extends StateStore.Prop> = StateStore[Prop] & {};
}
