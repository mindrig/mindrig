import { createLogWrap, logsVerbositySettingToLevel } from "@wrkspc/core/log";
import ReactDOM from "react-dom/client";
import { log } from "smollog";
import { App } from "./aspects/app/App";
import "./styles.css";

// Configure logging

log.level = logsVerbositySettingToLevel(
  window.initialState?.settings?.dev?.logsVerbosity,
);
log.wrap = createLogWrap();

// Render the app

const container = document.getElementById("root");

if (container) {
  const root = ReactDOM.createRoot(container);
  root.render(<App />);
} else {
  log.error("Failed to find root container");
}
