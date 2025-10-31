import { ClientStore } from "@wrkspc/core/client";
import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";
import { useVsc } from "../vsc/Context";

export namespace ClientStoreContext {
  export interface Value {
    store: ClientStore;
    setStore: StoreStateSet<ClientStore>;
  }

  export type StoreStateSet<Target = ClientStore> = (
    updater: StoreUpdater<Target>,
  ) => void;

  export type StoreUpdater<Target = ClientStore> = (store: Target) => Target;

  export type PropState<Prop extends keyof ClientStore> = [
    ClientStore[Prop],
    StoreStateSet<ClientStore[Prop]>,
  ];
}

export const ClientStoreContext = createContext<
  ClientStoreContext.Value | undefined
>(undefined);

export function ClientStoreProvider(props: React.PropsWithChildren) {
  const { vsc } = useVsc();
  const initialStore = useMemo(() => vsc.getState(), [vsc]);
  const [store, setStoreState] = useState<ClientStore>(initialStore);

  const setStore = useCallback<ClientStoreContext.StoreStateSet>(
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
    <ClientStoreContext.Provider value={value}>
      {props.children}
    </ClientStoreContext.Provider>
  );
}

export function useClientStore(): ClientStoreContext.Value {
  const store = useContext(ClientStoreContext);
  if (!store)
    throw new Error("useClientStore must be used within ClientStoreProvider");
  return store;
}

export function useClientStoreProp<Prop extends keyof ClientStore>(
  prop: Prop,
): ClientStoreContext.PropState<Prop> {
  const { store, setStore } = useClientStore();

  const propValue = store[prop];
  const setProp = useCallback<
    ClientStoreContext.StoreStateSet<ClientStore[Prop]>
  >(
    (updater) =>
      setStore((prevStore) => ({
        ...prevStore,
        [prop]: updater(prevStore[prop]),
      })),
    [prop, setStore],
  );

  const state = useMemo<ClientStoreContext.PropState<Prop>>(
    () => [propValue, setProp],
    [propValue, setProp],
  );
  return state;
}
