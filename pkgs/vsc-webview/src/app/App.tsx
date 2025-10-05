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
import { Auth } from "./Auth";
import { Context } from "./Context";
import { Index } from "./Index";
import { useGatewaySecretState } from "./hooks/useGatewaySecretState";
import { APP_ROUTE_CONFIG, getRoutePath } from "./routes";

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function App() {
  return (
    <HashRouter hashType="slash">
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
  const gatewaySecretState = useGatewaySecretState();

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <Routes>
        <Route
          path={indexPath}
          element={<Index gatewaySecretState={gatewaySecretState} />}
        />
        {APP_ROUTE_CONFIG.index.aliases.map((alias) => (
          <Route
            key={alias}
            path={alias}
            element={<Index gatewaySecretState={gatewaySecretState} />}
          />
        ))}
        <Route
          path={authPath}
          element={<Auth gatewaySecretState={gatewaySecretState} />}
        />
        <Route path="*" element={<Navigate to={indexPath} replace />} />
      </Routes>
    </RouterProvider>
  );
}
