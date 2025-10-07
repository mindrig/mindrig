import { useMessages } from "@/aspects/message/Context";
import { Auth, AuthGateway, resolveAuthGateway } from "@wrkspc/auth";
import { createContext, useCallback, useContext, useState } from "react";

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
  const [auth, setAuth] = useState<Auth>(
    window.initialState?.auth || { gateway: undefined },
  );
  const gateway = resolveAuthGateway(auth);
  const { useListen, send } = useMessages();

  useListen("auth-ext-update", (message) => setAuth(message.payload), [
    setAuth,
  ]);

  const logOut = useCallback(() => send({ type: "auth-wv-logout" }), [send]);

  return (
    <AuthContext.Provider value={{ auth, gateway, logOut }}>
      {props.children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContext.Value {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used within an AuthProvider");
  return value;
}
