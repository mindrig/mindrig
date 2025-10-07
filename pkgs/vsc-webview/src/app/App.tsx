import { useMessages } from "@/aspects/message/Context";
import { useEffect } from "react";
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
import { AuthPage } from "./Auth";
import { Context } from "./Context";
import { IndexPage } from "./Index";
import { APP_ROUTE_CONFIG, getRoutePath } from "./routes";

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function App() {
  return (
    <HashRouter>
      <Context>
        <Content />
      </Context>
    </HashRouter>
  );
}

function Content() {
  const navigate = useNavigate();
  const indexPath = getRoutePath("index");
  const authPath = getRoutePath("auth");
  const { send } = useMessages();

  useEffect(() => {
    send({ type: "lifecycle-wv-ready" });
  }, [send]);

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <Routes>
        <Route path={indexPath} element={<IndexPage />} />
        {APP_ROUTE_CONFIG.index.aliases.map((alias) => (
          <Route key={alias} path={alias} element={<IndexPage />} />
        ))}
        <Route path={authPath} element={<AuthPage />} />
        <Route path="*" element={<Navigate to={indexPath} replace />} />
      </Routes>
    </RouterProvider>
  );
}
