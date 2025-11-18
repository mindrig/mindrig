import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useVsc } from "../vsc/Context";
import { StateStore } from "./state/store";

export namespace AppStateStoreContext {
  export interface Value {
    store: StateStore;
    setStore: SetStore<StateStore>;
  }

  export type SetStore<Target = StateStore> = (
    updater: StoreUpdater<Target>,
  ) => void;

  export type StoreUpdater<Target = StateStore> = (store: Target) => Target;

  export type PropState<Prop extends keyof StateStore> = [
    StateStore[Prop],
    SetStore<StateStore[Prop]>,
  ];
}

export const AppStateStoreContext = createContext<
  AppStateStoreContext.Value | undefined
>(undefined);

export function AppStateStoreProvider(props: React.PropsWithChildren) {
  const { vsc } = useVsc();
  const initialStore = useMemo(() => vsc.getState(), [vsc]);
  const [store, setStoreState] = useState<StateStore>(initialStore);

  const setStore = useCallback<AppStateStoreContext.SetStore>(
    (updater) =>
      setStoreState((prevStore) => {
        const newStore = updater(prevStore);
        vsc.setState(newStore);
        return newStore;
      }),
    [vsc, setStoreState],
  );

  const value = useMemo(() => ({ store, setStore }), [store, setStore]);

  return (
    <AppStateStoreContext.Provider value={value}>
      {props.children}
    </AppStateStoreContext.Provider>
  );
}

export function useAppStateStore(): AppStateStoreContext.Value {
  const store = useContext(AppStateStoreContext);
  if (!store)
    throw new Error(
      "useAppStateStore must be used within AppStateStoreProvider",
    );
  return store;
}

export function useAppStateStoreProp<
  Prop extends keyof StateStore | undefined | null,
>(
  prop: Prop,
): Prop extends keyof StateStore
  ? AppStateStoreContext.PropState<Prop>
  : [undefined, () => void] {
  const { store, setStore } = useAppStateStore();

  const propValue = prop && store[prop];
  const setProp = useCallback(
    // TODO: Get rid of any
    (updater: any) =>
      prop
        ? setStore((prevStore) => ({
            ...prevStore,
            [prop]: updater(prevStore[prop]),
          }))
        : () => {},
    [prop, setStore],
  );

  const state = useMemo(() => [propValue, setProp], [propValue, setProp]);
  // TODO: Get rid of any
  return state as any;
}
