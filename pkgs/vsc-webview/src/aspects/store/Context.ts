import { Store, StoreMessage } from "@wrkspc/core/store";
import { Field } from "enso";
import { useCallback, useId, useMemo, useState } from "react";
import {
  useMessages,
  useSendMessage,
  useWaitMessage,
} from "../message/Context";

export namespace useStoreProp {
  export type Setter<Prop extends Store.Prop> = (value: Store[Prop]) => void;

  export type State<Prop extends Store.Prop> = [
    Store[Prop] | null,
    Setter<Prop>,
  ];
}

export function useStoreProp<Prop extends Store.Prop>(
  scope: Store.Scope,
  prop: Prop,
): useStoreProp.State<Prop> {
  const { sendMessage } = useMessages();
  const [value, setResult] = useState<Store[Prop] | null>(undefined);
  const requestId = useId() as Store.RequestId;

  useSendMessage(
    {
      type: "store-client-get",
      requestId,
      payload: { scope, prop: prop },
    },
    [requestId],
  );

  useWaitMessage(
    "store-server-get-response",
    (message: StoreMessage.ServerGetResponse<Prop>) => {
      if (message.requestId !== requestId) return;
      setResult(() => message.payload || null);
      return true;
    },
    [requestId, setResult],
  );

  const set = useCallback<useStoreProp.Setter<Prop>>(
    (value) => {
      setResult(() => value);
      const payload: StoreMessage.ClientSetPayload<Store.Scope, Prop> = {
        ref: { scope, prop },
        value,
      };
      sendMessage({ type: "store-client-set", payload });
    },
    [value && true, sendMessage],
  );

  const state = useMemo<useStoreProp.State<Prop>>(
    () => [value, set],
    [value, set],
  );

  return state;
}

export namespace useStoreField {
  export type InitialFn<StoreProp extends Store.Prop> =
    () => Store.Value<StoreProp>;
}

export function useStoreField<Prop extends Store.Prop>(
  scope: Store.Scope,
  prop: Prop,
  initialFn: useStoreField.InitialFn<Prop>,
): Field<Store.Value<Prop>> | undefined {
  const [storeState, setStoreState] = useStoreProp(scope, prop);
  // Differentiate null, undefined and non-nullish. It allows use to define
  // hooks that react on initial load (change from undefined to non-nullish or
  // null), rather than any change.
  const storeDep = storeState && true;

  const initialValue = useMemo(
    () => storeState || initialFn(),
    [storeDep, prop],
  );
  const field = Field.use(initialValue, [initialValue]);

  field.useWatch(
    (nextState) => {
      // If state is undefined, then we're still waiting for the response, so
      // we don't need to write the change.
      if (storeState === undefined) return;
      setStoreState(nextState);
    },
    [storeDep, setStoreState],
  );

  // We're still waiting for the server response if it's undefined.
  return storeState === undefined ? undefined : field;
}
