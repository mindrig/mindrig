import { VscMessage } from "@wrkspc/vsc-message";

export namespace Message {
  export type Callback<Type extends VscMessage.ExtensionType> = (
    message: VscMessage.Extension & { type: Type },
  ) => unknown;
}
