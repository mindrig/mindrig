import { Store, StoreMessage } from "@wrkspc/core/store";
import { useCallback, useId, useMemo, useState } from "react";
import {
  useMessages,
  useSendMessage,
  useWaitMessage,
} from "../message/Context";

export namespace useServerStoreState {
  export type Mapper<Key extends Store.Key, Result> = (
    message: StoreMessage.ServerGetResponse<Key> | undefined,
  ) => Result;

  export type Setter<Key extends Store.Key> = (value: Store[Key]) => void;

  export type State<Key extends Store.Key> = [
    Store[Key] | undefined,
    Setter<Key>,
  ];
}

export function useServerStoreState<Key extends Store.Key>(
  scope: Store.Scope,
  key: Key,
): useServerStoreState.State<Key> {
  const { sendMessage } = useMessages();
  const [value, setResult] = useState<Store[Key] | undefined>(undefined);
  const requestId = useId() as Store.RequestId;

  useSendMessage(
    {
      type: "store-client-get",
      requestId,
      payload: { scope, key },
    },
    [requestId],
  );

  useWaitMessage(
    "store-server-get-response",
    (message) => {
      if (message.requestId !== requestId) return;
      setResult(message.payload);
      return true;
    },
    [requestId, setResult],
  );

  const set = useCallback<useServerStoreState.Setter<Key>>(
    (value) => {
      setResult(() => value);
      sendMessage({
        type: "store-client-set",
        payload: { ref: { scope, key }, value },
      });
    },
    [sendMessage],
  );

  const state = useMemo(
    () => [value, set] as useServerStoreState.State<Key>,
    [value, set],
  );

  return state;
}
