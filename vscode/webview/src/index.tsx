import ReactDOM from "react-dom/client";
import { App } from "./App";
import "./styles.css";
import "@uiw/react-markdown-preview/markdown.css";

const container = document.getElementById("root");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
