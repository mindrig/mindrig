import type { AttachmentMessage } from "../attachment/message.js";
import type { AuthMessage } from "../auth/message.js";
import type { ClientMessage } from "../client/message.js";
import type { DatasetMessage } from "../dataset/message.js";
import type { ModelsMessage } from "../model/message.js";
import type { PlaygroundMessage } from "../playground/message.js";
import type { PromptMessage } from "../prompt/message.js";
import { ResultMessage } from "../result/message.js";
import type { RunMessage } from "../run/message.js";
import type { SettingsMessage } from "../settings/message.js";
import type { StoreMessage } from "../store/message.js";

export namespace Message {
  export type Server =
    | StoreMessage.Server
    | PromptMessage.Server
    | RunMessage.Server
    | ResultMessage.Server
    | SettingsMessage.Server
    | AuthMessage.Server
    | AttachmentMessage.Server
    | DatasetMessage.Server
    | ModelsMessage.Server
    | ClientMessage.Server
    | PlaygroundMessage.Server;

  export type ServerType = Server["type"];

  export type Client =
    | StoreMessage.Client
    | PromptMessage.Client
    | RunMessage.Client
    | ResultMessage.Client
    | SettingsMessage.Client
    | AuthMessage.Client
    | AttachmentMessage.Client
    | DatasetMessage.Client
    | ModelsMessage.Client
    | ClientMessage.Client
    | PlaygroundMessage.Client;

  export type ClientType = Client["type"];
}
