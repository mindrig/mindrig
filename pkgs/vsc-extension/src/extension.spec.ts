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
    console.log("All commands:", JSON.stringify(allCommands));
    const extCommands = allCommands.filter((cmd) => cmd.startsWith("mindrig"));
    assert.deepEqual(extCommands, [
      "mindrig.playground.open",
      "mindrig.playground.focus",
      "mindrig.playground.resetViewLocation",
      "mindrig.playground.toggleVisibility",
      "mindrig.playground.removeView",
    ]);
  });

  // TODO: Figure out why this test makes the tab click test fail
  test.skip("Workbench command opens the webview", async function () {
    const page = await ensureConnectMainPage();
    const frame = webviewFrameLocator(page);

    await switchToExplorer(page);

    await expect(frame.getByText(/Show Debug/)).not.toBeVisible();
    await vscode.commands.executeCommand("mindrig.workbench.open");
    await expect(frame.getByText(/Show Debug/)).toBeVisible();
  });

  test("Mind Rig tab opens the webview", async function () {
    const page = await ensureConnectMainPage();
    const frame = webviewFrameLocator(page);

    await switchToExplorer(page);

    await expect(frame.getByText(/Show Debug/)).not.toBeVisible();
    await page.getByRole("tab", { name: "Mind Rig" }).click();
    await expect(frame.getByText(/Show Debug/)).toBeVisible();
  });
});

function webviewFrameLocator(page: playwright.Page): playwright.FrameLocator {
  return page
    .frameLocator('iframe[src*="mindrig.mindrig"]')
    .frameLocator("iframe#active-frame");
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
  const extension = vscode.extensions.getExtension("mindrig.mindrig");
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

// NOTE: It is a VS Code term and has nothing to do with the Mind Rig
// Workbench feature.
const vscodeHtmlName = "workbench.html";
