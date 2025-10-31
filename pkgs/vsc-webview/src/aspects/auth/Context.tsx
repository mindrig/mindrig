import { useMessages } from "@/aspects/message/Context";
import { Auth, AuthGateway, resolveAuthGateway } from "@wrkspc/core/auth";
import { createContext, useCallback, useContext } from "react";
import { useClientState } from "../client/StateContext";

export namespace AuthContext {
  export interface Value {
    auth: Auth;
    gateway: AuthGateway.Resolve<AuthGateway.Type>;
    logOut(): void;
  }
}

export const AuthContext = createContext<AuthContext.Value | undefined>(
  undefined,
);

export function AuthProvider(props: React.PropsWithChildren) {
  const { state } = useClientState();
  const gateway = resolveAuthGateway(state.auth);
  const { send } = useMessages();

  const logOut = useCallback(
    () => send({ type: "auth-client-logout" }),
    [send],
  );

  return (
    <AuthContext.Provider value={{ auth: state.auth, gateway, logOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContext.Value {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within AuthProvider");
  return value;
}
