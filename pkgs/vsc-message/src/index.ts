import type { VscMessageSync } from "@wrkspc/vsc-sync";
import type { VscMessageAttachments } from "./message/attachments.js";
import type { VscMessageAuth } from "./message/auth.js";
import type { VscMessageDataset } from "./message/dataset.js";
import type { VscMessageFile } from "./message/file.js";
import type { VscMessageLifecycle } from "./message/lifecycle.js";
import type { VscMessageModels } from "./message/models.js";
import type { VscMessagePromptRun } from "./message/promptRun.js";
import type { VscMessagePrompts } from "./message/prompts.js";
import type { VscMessageSettings } from "./message/settings.js";

export * from "./message/attachments.js";
export * from "./message/auth.js";
export * from "./message/dataset.js";
export * from "./message/file.js";
export * from "./message/lifecycle.js";
export * from "./message/models.js";
export * from "./message/promptRun.js";
export * from "./message/prompts.js";
export * from "./message/settings.js";
export * from "./types.js";

export type VscMessage =
  | VscMessageSync
  | VscMessageFile
  | VscMessagePrompts
  | VscMessagePromptRun
  | VscMessageSettings
  | VscMessageAuth
  | VscMessageAttachments
  | VscMessageDataset
  | VscMessageModels
  | VscMessageLifecycle;

export namespace VscMessage {
  export type Type = VscMessage["type"];

  export type Extension =
    | VscMessageSync.Extension
    | VscMessageFile.Extension
    | VscMessagePrompts.Extension
    | VscMessagePromptRun.Extension
    | VscMessageSettings.Extension
    | VscMessageAuth.Extension
    | VscMessageAttachments.Extension
    | VscMessageDataset.Extension
    | VscMessageModels.Extension
    | VscMessageLifecycle.Extension;

  export type ExtensionType = Extension["type"];

  export type Webview =
    | VscMessageSync.Webview
    | VscMessageFile.Webview
    | VscMessagePrompts.Webview
    | VscMessagePromptRun.Webview
    | VscMessageSettings.Webview
    | VscMessageAuth.Webview
    | VscMessageAttachments.Webview
    | VscMessageDataset.Webview
    | VscMessageModels.Webview
    | VscMessageLifecycle.Webview;

  export type WebviewType = Webview["type"];
}
