import { Store, StoreMessage } from "@wrkspc/core/store";
import { useCallback, useId, useMemo, useState } from "react";
import {
  useMessages,
  useSendMessage,
  useWaitMessage,
} from "../message/Context";

export namespace UseStore {
  export type Mapper<Key extends Store.Key, Result> = (
    message: StoreMessage.ServerGetResponse<Key> | undefined,
  ) => Result;

  export type Setter<Key extends Store.Key> = (value: Store[Key]) => void;

  export type State<Key extends Store.Key> = [
    Store[Key] | undefined,
    Setter<Key>,
  ];
}

export function useStore<Key extends Store.Key>(
  scope: Store.Scope,
  key: Key,
): UseStore.State<Key> {
  const { send } = useMessages();
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

  const set = useCallback<UseStore.Setter<Key>>(
    (value) => {
      setResult(() => value);
      send({
        type: "store-client-set",
        payload: { ref: { scope, key }, value },
      });
    },
    [send],
  );

  const state = useMemo(
    () => [value, set] as UseStore.State<Key>,
    [value, set],
  );

  return state;
}
