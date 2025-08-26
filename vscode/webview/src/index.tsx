import { App } from "./App";
import ReactDOM from "react-dom/client";

const container = document.getElementById("root");
if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
}
