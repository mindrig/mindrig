import type { VscMessageSync } from "@wrkspc/vsc-sync";

import type { VscMessageAuth } from "./domains/auth/messages.js";
import type { VscMessageAttachments } from "./domains/attachments/messages.js";
import type { VscMessageDataset } from "./domains/dataset/messages.js";
import type { VscMessageFile } from "./domains/file/messages.js";
import type { VscMessageLifecycle } from "./domains/lifecycle/messages.js";
import type { VscMessageModels } from "./domains/models/messages.js";
import type { VscMessagePromptRun } from "./domains/prompt-run/messages.js";
import type { VscMessagePrompts } from "./domains/prompts/messages.js";
import type { VscMessageSettings } from "./domains/settings/messages.js";

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

export type { VscMessageSync };
