import { expect } from "@playwright/test";
import * as assert from "assert";
import * as playwright from "playwright-core";
import * as vscode from "vscode";

suite("Extension", () => {
  test("Extension exists", () => {
    ensureExtension();
  });

  test("Extension commands", async function () {
    const allCommands = await vscode.commands.getCommands(true);
    const extCommands = allCommands.filter((cmd) =>
      cmd.startsWith("mindcontrol"),
    );
    assert.deepEqual(extCommands, [
      "mindcontrol.workbench.open",
      "mindcontrol.workbench.focus",
      "mindcontrol.workbench.resetViewLocation",
      "mindcontrol.workbench.toggleVisibility",
      "mindcontrol.workbench.removeView",
    ]);
  });

  // TODO: Figure out why this test makes the tab click test fail
  test.skip("Workbench command opens the webview", async function () {
    const page = await ensureConnectMainPage();
    const frame = webviewFrameLocator(page);

    await switchToExplorer(page);

    await expect(frame.getByText(/Mind Control Code/)).not.toBeVisible();
    await vscode.commands.executeCommand("mindcontrol.workbench.open");
    await expect(frame.getByText(/Mind Control Code/)).toBeVisible();
  });

  test("Mind Control Code tab opens the webview", async function () {
    const page = await ensureConnectMainPage();
    const frame = webviewFrameLocator(page);

    await switchToExplorer(page);

    await expect(frame.getByText(/Mind Control Code/)).not.toBeVisible();
    await page.getByRole("tab", { name: "Mind Control Code" }).click();
    await expect(frame.getByText(/Mind Control Code/)).toBeVisible();
  });
});

function webviewFrameLocator(page: playwright.Page): playwright.FrameLocator {
  return page
    .frameLocator('iframe[src*="mindcontrol.vscode"]')
    .frameLocator("#active-frame");
}

function switchToExplorer(page: playwright.Page) {
  return page.getByRole("tab", { name: /Explorer/ }).click();
}

async function ensureConnectMainPage() {
  const browser = await connectBrowser();
  const contexts = browser.contexts();
  return ensureMainPage(contexts);
}

// TODO: Find a way to type (and verify it) the extension
function ensureExtension(): vscode.Extension<unknown> {
  const extension = vscode.extensions.getExtension("mindcontrol.vscode");
  assert.ok(extension !== undefined, "Extension should be found");
  return extension;
}

function ensureMainPage(
  contexts: playwright.BrowserContext[],
): playwright.Page {
  for (const context of contexts) {
    const pages = context.pages();

    for (const page of pages) {
      const url = page.url();
      if (url.endsWith(vscodeHtmlName)) return page;
    }
  }

  assert.fail("Can't find the main VS Code page");
}

async function connectBrowser(): Promise<playwright.Browser> {
  // TODO: Figure out how to use the WebSocket protocol instead of CDP
  // const wsUrl = await fetchWsDebuggerUrl();
  // return playwright.chromium.connect(wsUrl);

  return playwright.chromium.connectOverCDP(`http://localhost:${debuggerPort}`);
}

// NOTE: It is unused, as Playwright is having a trouble to connect via WebSocket
async function fetchWsDebuggerUrl(): Promise<string> {
  const resp = await fetch(`http://localhost:${debuggerPort}/json/version`);
  const json = await resp.json();

  if (!json || typeof json !== "object")
    assert.fail("DevTools Remote info response is not valid");
  if (!("webSocketDebuggerUrl" in json))
    assert.fail("DevTool's WebSocket debugger URL is missing");
  if (typeof json.webSocketDebuggerUrl !== "string")
    assert.fail("DevTool's WebSocket debugger URL is not a string");

  return json.webSocketDebuggerUrl;
}

const debuggerPort = 9222;

// NOTE: It is a VS Code term and has nothing to do with the Mind Control
// Workbench feature.
const vscodeHtmlName = "workbench.html";
