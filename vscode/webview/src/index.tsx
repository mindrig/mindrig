import "@uiw/react-markdown-preview/markdown.css";
import { RouterProvider } from "react-aria-components";
import ReactDOM from "react-dom/client";
import {
  BrowserRouter,
  NavigateOptions,
  Route,
  Routes,
  useHref,
  useNavigate,
} from "react-router-dom";
import { App } from "./App";
import "./styles.css";

declare module "react-aria-components" {
  interface RouterConfig {
    routerOptions: NavigateOptions;
  }
}

const container = document.getElementById("root");

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(
    <BrowserRouter>
      <Inner />
    </BrowserRouter>,
  );
}

function Inner() {
  const navigate = useNavigate();

  return (
    <RouterProvider navigate={navigate} useHref={useHref}>
      <Routes>
        <Route path="/index.html" element={<App />} />
        <Route path="/" element={<App />} />
      </Routes>
    </RouterProvider>
  );
}
