import type { VscMessageSync } from "@wrkspc/vsc-sync";

import type { VscMessageAttachments } from "./message/attachments.js";
import type { VscMessageAuth } from "./message/auth.js";
import type { VscMessageDataset } from "./message/dataset.js";
import type { VscMessageDev } from "./message/dev.js";
import type { VscMessageFile } from "./message/file.js";
import type { VscMessageLifecycle } from "./message/lifecycle.js";
import type { VscMessageModels } from "./message/models.js";
import type { VscMessagePromptRun } from "./message/promptRun.js";
import type { VscMessagePrompts } from "./message/prompts.js";
import type { VscMessageSettings } from "./message/settings.js";

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
  | VscMessageLifecycle
  | VscMessageDev;

export namespace VscMessage {
  export type Type = VscMessage["type"];

  export type Extension = VscMessageAuth.Extension;

  export type ExtensionType = Extension["type"];

  export type Webview = VscMessageAuth.Webview;

  export type WebviewType = Webview["type"];
}
