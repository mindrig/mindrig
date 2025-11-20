import { Store, StoreMessage } from "@wrkspc/core/store";
import { ChangesEvent, Field, State } from "enso";
import { useId, useMemo, useRef, useState } from "react";
import {
  useMessages,
  useSendMessage,
  useWaitMessage,
} from "../message/Context";

export function useStorePropState<Prop extends Store.Prop>(
  scope: Store.Scope,
  prop: Prop,
): State<Store[Prop] | null> {
  const { sendMessage } = useMessages();
  const propState = State.use<Store[Prop] | null>(undefined, [scope, prop]);
  const requestId = useId() as Store.RequestId;

  useSendMessage(
    {
      type: "store-client-get",
      requestId,
      payload: { scope, prop },
    },
    [requestId],
  );

  const selfSetSymbol = useMemo(() => Symbol(), [propState]);

  useWaitMessage(
    "store-server-get-response",
    (message: StoreMessage.ServerGetResponse<Prop>) => {
      if (message.requestId !== requestId) return false;
      ChangesEvent.context({ [selfSetSymbol]: true }, () =>
        propState.set(message.payload || null),
      );
      return true;
    },
    [requestId, propState, selfSetSymbol],
  );

  propState.useWatch(
    (value, event) => {
      if (event.context[selfSetSymbol]) return;
      const payload: StoreMessage.ClientSetPayload<Store.Scope, Prop> = {
        ref: { scope, prop },
        value: value || undefined,
      };
      sendMessage({ type: "store-client-set", payload });
    },
    [propState, sendMessage, selfSetSymbol],
  );

  return propState;
}

export namespace useStorePropField {
  export type InitialFn<StoreProp extends Store.Prop> =
    () => Store.Value<StoreProp>;
}

export function useStorePropField<Prop extends Store.Prop>(
  scope: Store.Scope,
  prop: Prop,
  initialFn: useStorePropField.InitialFn<Prop>,
): Field<Store.Value<Prop>> | undefined {
  const propState = useStorePropState(scope, prop);

  // Differentiate null, undefined and non-nullish. It allows use to define
  // hooks that react on initial load (change from undefined to non-nullish or
  // null), rather than any change.
  const isLoading = propState.useCompute((state) => state === undefined, []);

  const fallbackValue = useMemo<Store.Value<Prop>>(initialFn, [initialFn]);

  // We create the field with the fallback value to ensure it is always defined.
  const propField = Field.use<Store.Value<Prop>>(fallbackValue, [
    fallbackValue,
    propState,
  ]);

  // Make loading flag dependent on propState.
  const isLoadingRef = useRef(isLoading);
  useMemo(() => {
    isLoadingRef.current = propState.value === undefined;
  }, [propState]);

  // We will use this to force a rerender when we get updates from the state.
  const [_, setRerender] = useState(0);

  const selfSetSymbol = useMemo(() => Symbol(), [propState]);

  propState.useWatch(
    (nextState) => {
      // Set context to indicate that this update is coming from the store state
      // and should not update it back.
      ChangesEvent.context({ [selfSetSymbol]: true }, () =>
        propField.set((nextState as Store[Prop]) ?? fallbackValue),
      );

      // Trigger rerender when transitioning from loading to loaded.
      if (isLoadingRef.current) {
        isLoadingRef.current = nextState === undefined;
        if (!isLoadingRef.current) setRerender((c) => c + 1);
      }
    },
    [propField, fallbackValue, isLoadingRef, setRerender, selfSetSymbol],
  );

  propField.useWatch(
    (nextState, event) => {
      // Prevent cyclic updates.
      if (event.context[selfSetSymbol]) return;
      propState.set(nextState);
    },
    [propState, selfSetSymbol],
  );

  // We're still waiting for the server response, so the field is not ready yet.
  return isLoadingRef.current ? undefined : propField;
}
