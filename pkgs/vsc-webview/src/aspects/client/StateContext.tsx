import { ClientState } from "@wrkspc/core/client";
import { buildPlaygroundState } from "@wrkspc/core/playground";
import { createContext, useContext, useState } from "react";
import { useMessages } from "../message/Context";

export namespace ClientStateContext {
  export interface Value {
    state: ClientState;
  }
}

export const ClientStateContext = createContext<
  ClientStateContext.Value | undefined
>(undefined);

export function ClientStateProvider(props: React.PropsWithChildren) {
  const { useListen } = useMessages();

  const [state, setState] = useState<ClientState>(
    window.initialState || {
      auth: { gateway: null },
      playground: buildPlaygroundState(),
    },
  );

  useListen(
    "auth-server-update",
    (message) => setState((state) => ({ ...state, auth: message.payload })),
    [setState],
  );

  useListen(
    "settings-server-update",
    (message) => setState((state) => ({ ...state, settings: message.payload })),
    [setState],
  );

  useListen(
    "playground-server-update",
    (message) =>
      setState((state) => ({ ...state, playground: message.payload })),
    [setState],
  );

  return (
    <ClientStateContext.Provider value={{ state }}>
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
