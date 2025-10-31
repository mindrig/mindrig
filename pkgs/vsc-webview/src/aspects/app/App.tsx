import { useMessages } from "@/aspects/message/Context";
import { pageHrefs } from "@/aspects/page/route";
import { Page } from "@wrkspc/core/page";
import React, { useEffect } from "react";
import { RouterProvider } from "react-aria-components";
import {
  HashRouter,
  Navigate,
  NavigateOptions,
  Route,
  Routes,
  useHref,
  useNavigate,
} from "react-router-dom";
import { AuthPage } from "../auth/Page";
import { PlaygroundPage } from "../playground/Page";
import { AppContext } from "./Context";

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function App() {
  return (
    <HashRouter>
      <AppContext>
        <Content />
      </AppContext>
    </HashRouter>
  );
}

function Content() {
  const navigate = useNavigate();

  const { send, useListen } = useMessages();

  useEffect(() => send({ type: "client-client-ready" }), [send]);

  useListen("client-server-navigate", (message) =>
    navigate(pageHrefs[message.payload.type]()),
  );

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <Routes>
        <Route
          path={pageHrefs.playground()}
          element={
            <PageRoute page={{ type: "playground" }}>
              <PlaygroundPage />
            </PageRoute>
          }
        />

        <Route
          path={pageHrefs.auth()}
          element={
            <PageRoute page={{ type: "auth" }}>
              <AuthPage />
            </PageRoute>
          }
        />

        <Route
          path="*"
          element={<Navigate to={pageHrefs.playground()} replace />}
        />
      </Routes>
    </RouterProvider>
  );
}

export namespace PageRoute {
  export interface Props {
    page: Page;
  }
}

function PageRoute(props: React.PropsWithChildren<PageRoute.Props>) {
  const { page, children } = props;

  const { send } = useMessages();
  useEffect(() => {
    send({ type: "client-client-navigated", payload: props.page });
  }, [send]);

  return children;
}
