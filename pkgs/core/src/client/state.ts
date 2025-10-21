import { Auth } from "../auth";
import { PlaygroundState } from "../playground/index.js";
import { Settings } from "../settings";

export interface ClientState {
  auth: Auth;
  settings?: Settings | undefined;
  playground: PlaygroundState;
}
