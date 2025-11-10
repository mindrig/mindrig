import { State } from "enso";
import { useMemo } from "react";
import { useAppStateStoreProp } from "../StateStoreContext";
import { StateStore } from "./store";

export namespace useAppState {
  export type Prop = keyof StateStore;

  export type InitialFn<StoreProp extends useAppState.Prop> =
    () => StateStore.Value<StoreProp>;
}

export function useAppState<
  StoreProp extends useAppState.Prop | undefined | null,
>(
  prop: StoreProp,
  initialFn: StoreProp extends useAppState.Prop
    ? useAppState.InitialFn<StoreProp>
    : () => unknown,
): StoreProp extends useAppState.Prop
  ? State<StateStore.Value<StoreProp>>
  : StoreProp {
  const [storeState, setStoreState] = useAppStateStoreProp(prop);
  const initialValue = useMemo(() => storeState || initialFn(), [prop]);
  const state = State.use(initialValue, [prop]);

  state.useWatch(
    // TODO: Get rid of any
    (nextState: any) => setStoreState(() => nextState),
    [setStoreState],
  );

  // TODO: Get rid of any
  return state as any;
}
