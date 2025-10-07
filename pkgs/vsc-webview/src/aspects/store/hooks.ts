import { Store } from "@wrkspc/core/store";
import { VscMessageStore } from "node_modules/@wrkspc/core/src/message/message/store";
import { useCallback, useId, useState } from "react";
import {
  useMessages,
  useSendMessage,
  useWaitMessage,
} from "../message/Context";

export namespace UseStoreState {
  export type Mapper<Key extends Store.Key, Result> = (
    message: VscMessageStore.ExtGetResponse<Key> | undefined,
  ) => Result;

  export type Setter<Key extends Store.Key> = (value: Store[Key]) => void;

  export type Result<Key extends Store.Key> = [
    Store[Key] | undefined,
    Setter<Key>,
  ];
}

export function useStoreState<Key extends Store.Key>(
  scope: Store.Scope,
  key: Key,
): UseStoreState.Result<Key> {
  const { send } = useMessages();
  const [value, setResult] = useState<Store[Key] | undefined>(undefined);
  const requestId = useId() as Store.RequestId;

  useSendMessage(
    {
      type: "store-wv-get",
      requestId,
      payload: { scope, key },
    },
    [requestId],
  );

  useWaitMessage(
    "store-ext-get-response",
    (message) => {
      if (message.requestId !== requestId) return;
      setResult(message.payload);
      return true;
    },
    [requestId, setResult],
  );

  const set = useCallback<UseStoreState.Setter<Key>>(
    (value) => {
      setResult(() => value);
      send({
        type: "store-wv-set",
        payload: { ref: { scope, key }, value },
      });
    },
    [send],
  );

  return [value, set];
}
