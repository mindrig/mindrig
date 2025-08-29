#!/usr/bin/env tsx

import * as fs from "fs/promises";
import * as path from "path";
import { workbenchWebviewHtml } from "../../src/WorkbenchView/html";

const html = workbenchWebviewHtml({
  uris: {
    app: "/src/index.tsx",
    reactRefresh: "/@react-refresh",
    viteClient: "/@vite/client",
  },
  useDevServer: true,
});

const htmlPath = path.resolve(__dirname, "../../../webview/index.html");

fs.writeFile(htmlPath, html);
