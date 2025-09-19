import { RouterProvider } from "react-aria-components";
import {
  BrowserRouter,
  NavigateOptions,
  Route,
  Routes,
  useHref,
  useNavigate,
} from "react-router-dom";
import { Context } from "./Context";
import { Index } from "./Index";

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

export function App() {
  return (
    <BrowserRouter>
      <Context>
        <Content />
      </Context>
    </BrowserRouter>
  );
}

function Content() {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <Routes>
        <Route path="/index.html" element={<Index />} />
        <Route path="/" element={<Index />} />
      </Routes>
    </RouterProvider>
  );
}
