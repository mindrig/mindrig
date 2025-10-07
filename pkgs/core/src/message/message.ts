import type { VscMessageAttachment } from "./message/attachment.js";
import type { VscMessageAuth } from "./message/auth.js";
import type { VscMessageDataset } from "./message/dataset.js";
import type { VscMessageEditor } from "./message/editor.js";
import type { VscMessageLifecycle } from "./message/lifecycle.js";
import type { VscMessageModels } from "./message/models.js";
import type { VscMessagePage } from "./message/page.js";
import type { VscMessagePrompt } from "./message/prompt.js";
import type { VscMessagePromptRun } from "./message/promptRun.js";
import type { VscMessageSettings } from "./message/settings.js";
import type { VscMessageStore } from "./message/store.js";

export namespace VscMessage {
  export type Extension =
    | VscMessageStore.Extension
    | VscMessageEditor.Extension
    | VscMessagePrompt.Extension
    | VscMessagePromptRun.Extension
    | VscMessageSettings.Extension
    | VscMessageAuth.Extension
    | VscMessageAttachment.Extension
    | VscMessageDataset.Extension
    | VscMessageModels.Extension
    | VscMessageLifecycle.Extension
    | VscMessagePage.Extension;

  export type ExtensionType = Extension["type"];

  export type Webview =
    | VscMessageStore.Webview
    | VscMessageEditor.Webview
    | VscMessagePrompt.Webview
    | VscMessagePromptRun.Webview
    | VscMessageSettings.Webview
    | VscMessageAuth.Webview
    | VscMessageAttachment.Webview
    | VscMessageDataset.Webview
    | VscMessageModels.Webview
    | VscMessageLifecycle.Webview
    | VscMessagePage.Webview;

  export type WebviewType = Webview["type"];
}
