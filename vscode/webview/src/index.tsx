import "@uiw/react-markdown-preview/markdown.css";
import ReactDOM from "react-dom/client";
import { App } from "./app/App";
import "./styles.css";

const container = document.getElementById("root");

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
