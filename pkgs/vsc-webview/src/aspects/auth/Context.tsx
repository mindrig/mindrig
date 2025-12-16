import { useMessages } from "@/aspects/message/Context";
import { Auth, AuthGateway, defaultAuthGatewayType } from "@wrkspc/core/auth";
import { State } from "enso";
import { createContext, useCallback, useContext } from "react";
import { useClientState } from "../client/StateContext";

export namespace AuthContext {
  export interface Value {
    authState: State<Auth>;
    gateway: AuthGateway.Resolve<AuthGateway.Type>;
    clearAuth(): void;
  }
}

export const AuthContext = createContext<AuthContext.Value | undefined>(
  undefined,
);

export function AuthProvider(props: React.PropsWithChildren) {
  const state = useClientState();
  // TODO: Consider adding observable refs derived from state/fields to Enso.
  const gateway = state.$.auth.useCompute(
    (auth) => ({
      type: auth.gateway?.type || defaultAuthGatewayType,
      gateway: auth.gateway,
    }),
    [],
  );
  const { sendMessage } = useMessages();

  const clearAuth = useCallback(
    () => sendMessage({ type: "auth-client-clear" }),
    [sendMessage],
  );

  return (
    <AuthContext.Provider
      value={{ authState: state.$.auth, gateway, clearAuth: clearAuth }}
    >
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContext.Value {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
