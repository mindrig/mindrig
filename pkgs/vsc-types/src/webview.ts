import { Auth } from "@wrkspc/auth";
import { VscSettings } from "./settings";

export interface VscWebviewState {
  auth: Auth;
  settings?: VscSettings | undefined;
}
