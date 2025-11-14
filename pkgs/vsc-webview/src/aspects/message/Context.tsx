import { useVsc } from "@/aspects/vsc/Context";
import type { Message } from "@wrkspc/core/message";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type DependencyList,
} from "react";

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

//#region Legacy

export type VscMessageHandler<Type extends Message.ServerType> = (
  message: Message.Server & { type: Type },
) => void;

export interface MessageSubscription {
  dispose(): void;
}

export type MessageOff = () => void;

export interface MessageLoggerEntry {
  direction: "in" | "out";
  message: unknown;
}

export interface MessagesContextValue {
  sendMessage: MessagesContext.SendMessage;

  listen: <Type extends Message.ServerType>(
    type: Type,
    handler: VscMessageHandler<Type>,
  ) => MessageOff;

  useListen: <Type extends Message.ServerType>(
    type: Type,
    handler: VscMessageHandler<Type>,
    deps?: DependencyList,
  ) => void;
}

export interface MessageProviderOptions {
  debug?: boolean;
  logger?: (entry: MessageLoggerEntry) => void;
  onUnhandledMessage?: (message: unknown) => void;
}

// function narrowMessage(candidate: unknown): candidate is VscMessage {
//   if (!candidate || typeof candidate !== "object") return false;
//   if (typeof (candidate as { type?: unknown }).type !== "string") return false;
//   return true;
// }

//#endregion

const MessagesContext = createContext<MessagesContext.Value | undefined>(
  undefined,
);

export function MessagesProvider(
  props: PropsWithChildren<MessageProviderOptions>,
) {
  const { debug, logger, onUnhandledMessage, children } = props;
  const { vsc } = useVsc();
  type InternalHandler = (message: Message.Server) => void;
  const handlersRef = useRef(new Map<string, Set<InternalHandler>>());

  const listen = useCallback<MessagesContext.ListenMessage>(
    (type, callback) => {
      const bucket =
        handlersRef.current.get(type) ?? new Set<InternalHandler>();
      const wrapped: InternalHandler = (message) => callback(message as any);

      bucket.add(wrapped);
      handlersRef.current.set(type, bucket);

      return () => {
        const listeners = handlersRef.current.get(type);
        listeners?.delete(wrapped);
        if (listeners && listeners.size === 0) handlersRef.current.delete(type);
      };
    },
    [],
  );

  const sendMessage = useCallback<MessagesContextValue["sendMessage"]>(
    (message) => {
      logger?.({ direction: "out", message });
      vsc.postMessage?.(message);
    },
    [logger, vsc],
  );

  const useListen = useCallback<MessagesContext.UseListenMessage>(
    (type, callback, deps) => {
      useEffect(() => {
        return listen(type, callback);
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [listen, type, ...deps]);
    },
    [listen],
  );

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data;
      // if (!narrowMessage(payload)) {
      //   onUnhandledMessage?.(payload);
      //   if (debug) console.warn("Received unknown message", payload);
      //   return;
      // }

      logger?.({ direction: "in", message: payload });

      const listeners = handlersRef.current.get(payload.type);
      if (!listeners || listeners.size === 0) return;

      listeners.forEach((handler) => {
        try {
          handler(payload as never);
        } catch (error) {
          console.error(
            `Message handler for ${payload.type} threw an error`,
            error,
          );
        }
      });
    };

    window.addEventListener("message", handleMessage);
    const handlersMap = handlersRef.current;
    return () => {
      window.removeEventListener("message", handleMessage);
      handlersMap.clear();
    };
  }, [debug, logger, onUnhandledMessage]);

  const value: MessagesContext.Value = {
    sendMessage,
    listen,
    useListen,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
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
  ) => boolean | void;
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
