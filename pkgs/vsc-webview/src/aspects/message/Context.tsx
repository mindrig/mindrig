import { useVsc } from "@/aspects/vsc/Context";
import type { Message } from "@wrkspc/core/message";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  type DependencyList,
} from "react";
import { log } from "smollog";

export namespace MessagesContext {
  export interface Value {
    sendMessage: SendMessage;

    listen: ListenMessage;

    useListen: UseListenMessage;
  }

  export type ListenMessage = <Type extends Message.ServerType>(
    type: Type,
    callback: ListenMessageCallback<Type>,
  ) => ListenMessageOff;

  export type ListenMessageCallback<Type extends Message.ServerType> = (
    message: Message.Server & { type: Type },
  ) => void;

  export type ListenMessageOff = () => void;

  export type UseListenMessage = <Type extends Message.ServerType>(
    type: Type,
    callback: ListenMessageCallback<Type>,
    deps: DependencyList,
  ) => void;

  export type SendMessage = (message: Message.Client) => void;

  export type UseSend = (message: Message.Client) => void;
}

const MessagesContext = createContext<MessagesContext.Value | undefined>(
  undefined,
);

export function MessagesProvider(props: PropsWithChildren) {
  const { vsc } = useVsc();

  const target = useMemo(() => new EventTarget(), []);

  const listen = useCallback<MessagesContext.ListenMessage>(
    <Type extends Message.ServerType>(
      type: Type,
      callback: MessagesContext.ListenMessageCallback<Type>,
    ) => {
      const handler = (ev: CustomEvent<Message.Server & { type: Type }>) => {
        callback.call(parent, ev.detail);
      };

      target.addEventListener(type, handler as any);

      return () => target.removeEventListener(type, handler as any);
    },
    [target],
  );

  const sendMessage = useCallback<MessagesContext.SendMessage>(
    (message) => {
      log.debug("Sending message to server:", message);
      vsc.postMessage(message);
    },
    [vsc],
  );

  const useListen = useCallback<MessagesContext.UseListenMessage>(
    (type, callback, deps) => {
      useEffect(
        () => listen(type, callback),
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [listen, type, ...deps],
      );
    },
    [listen],
  );

  useEffect(() => {
    const onMessage = (event: MessageEvent) => {
      const message: Message.Server = event.data;
      log.debug("Received message from server:", message);
      target.dispatchEvent(new CustomEvent(message.type, { detail: message }));
    };

    window.addEventListener("message", onMessage);

    return () => window.removeEventListener("message", onMessage);
  }, []);

  const value = useMemo<MessagesContext.Value>(
    () => ({ sendMessage, listen, useListen }),
    [sendMessage, listen, useListen],
  );

  return (
    <MessagesContext.Provider value={value}>
      {props.children}
    </MessagesContext.Provider>
  );
}

export function useMessages(): MessagesContext.Value {
  const context = useContext(MessagesContext);
  if (!context)
    throw new Error("useMessage must be used within MessageProvider");
  return context;
}

export function useListenMessage<Type extends Message.ServerType>(
  type: Type,
  callback: MessagesContext.ListenMessageCallback<Type>,
  deps: DependencyList,
) {
  const { useListen } = useMessages();
  useListen(type, callback, deps);
}

export function useSendMessage(message: Message.Client, deps?: DependencyList) {
  const { sendMessage } = useMessages();
  useEffect(() => sendMessage(message), [sendMessage, ...(deps ?? [])]);
}

export namespace UseWaitMessage {
  export type Callback<Type extends Message.ServerType> = (
    message: Message.Server & { type: Type },
  ) => boolean;
}

export function useWaitMessage<Type extends Message.ServerType>(
  type: Type,
  handler: UseWaitMessage.Callback<Type>,
  deps: DependencyList,
) {
  const { listen } = useMessages();
  useEffect(() => {
    const off = listen(type, (message) => {
      const matched = handler(message);
      if (!matched) return;
      off();
    });
    return off;
  }, [listen, type, ...deps]);
}
