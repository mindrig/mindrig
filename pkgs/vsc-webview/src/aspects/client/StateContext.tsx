import { ClientState } from "@wrkspc/core/client";
import { logsVerbositySettingToLevel } from "@wrkspc/core/log";
import { buildPlaygroundState } from "@wrkspc/core/playground";
import { atomChange, State } from "enso";
import { createContext, useContext, useEffect } from "react";
import { log } from "smollog";
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

  useEffect(() => {
    log.debug("Initialized client state", state.value);
  }, []);

  useListen(
    "auth-server-update",
    (message) => {
      state.$.auth.set(message.payload);
      // NOTE: Force reactivity even if the same value is set. It allows to
      // reset form errors after receiving the same auth state from the server.
      if (!state.$.auth.lastChanges) state.$.auth.trigger(atomChange.value);
    },
    [state],
  );

  useListen(
    "settings-server-update",
    (message) => {
      state.$.settings.set(message.payload);

      // Update logging level according to the new settings
      log.level = logsVerbositySettingToLevel(
        message.payload.dev?.logsVerbosity,
      );
    },
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
