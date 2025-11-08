import { ClientState } from "@wrkspc/core/client";
import { buildPlaygroundState } from "@wrkspc/core/playground";
import { State } from "enso";
import { createContext, useContext } from "react";
import { useMessages } from "../message/Context";

export namespace ClientStateContext {
  export type Value = State<ClientState>;
}

export const ClientStateContext = createContext<
  ClientStateContext.Value | undefined
>(undefined);

export function ClientStateProvider(props: React.PropsWithChildren) {
  const { useListen } = useMessages();

  const state = State.use<ClientState>(
    window.initialState || {
      auth: { gateway: null },
      playground: buildPlaygroundState(),
    },
    [],
  );

  useListen(
    "auth-server-update",
    (message) => state.$.auth.set(message.payload),
    [state],
  );

  useListen(
    "settings-server-update",
    (message) => state.$.settings.set(message.payload),
    [state],
  );

  useListen(
    "playground-server-update",
    (message) => state.$.playground.set(message.payload),
    [state],
  );

  return (
    <ClientStateContext.Provider value={state}>
      {props.children}
    </ClientStateContext.Provider>
  );
}

export function useClientState(): ClientStateContext.Value {
  const value = useContext(ClientStateContext);
  if (!value)
    throw new Error("useClientState must be used within ClientStateProvider");
  return value;
}
