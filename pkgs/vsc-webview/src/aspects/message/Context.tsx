// @ts-nocheck -- TODO: Rewrite messages context

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
  send: (message: Message.Client) => void;

  listen: <Type extends Message.ServerType>(
    type: Type,
    handler: VscMessageHandler<Type>,
  ) => MessageOff;

  useListen: <Type extends Message.ServerType>(
    type: Type,
    handler: VscMessageHandler<Type>,
    deps?: DependencyList,
  ) => void;

  useSend: (message: Message.Client) => void;
}

export interface MessageProviderOptions {
  debug?: boolean;
  logger?: (entry: MessageLoggerEntry) => void;
  onUnhandledMessage?: (message: unknown) => void;
}

const MessagesContext = createContext<MessagesContextValue | null>(null);

function narrowMessage(candidate: unknown): candidate is VscMessage {
  if (!candidate || typeof candidate !== "object") return false;
  if (typeof (candidate as { type?: unknown }).type !== "string") return false;
  return true;
}

//#endregion

export function MessagesProvider(
  props: PropsWithChildren<MessageProviderOptions>,
) {
  const { debug, logger, onUnhandledMessage, children } = props;
  const { vsc } = useVsc();
  type InternalHandler = (message: Message.Server) => void;
  const handlersRef = useRef(new Map<string, Set<InternalHandler>>());

  const listen = useCallback(
    <Type extends Message.ServerType>(
      type: Type,
      handler: Message.Callback<Type>,
    ): MessageOff => {
      const bucket =
        handlersRef.current.get(type) ?? new Set<InternalHandler>();
      const wrapped: InternalHandler = (incoming) =>
        handler(incoming as Message.Server & { type: Type });

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

  const send = useCallback<MessagesContextValue["send"]>(
    (message) => {
      logger?.({ direction: "out", message });
      vsc.postMessage?.(message);
    },
    [logger, vsc],
  );

  const useListen = <Type extends Message.ServerType>(
    type: Type,
    handler: VscMessageHandler<Type>,
    deps: DependencyList = [],
  ) => {
    useEffect(() => {
      const subscription = listen(type, handler);
      return () => subscription.dispose();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listen, type, ...deps]);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const payload = event.data;
      if (!narrowMessage(payload)) {
        onUnhandledMessage?.(payload);
        if (debug) console.warn("Received unknown message", payload);
        return;
      }

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

  const value: MessagesContextValue = {
    send,
    listen,
    useListen,
  };

  return (
    <MessagesContext.Provider value={value}>
      {children}
    </MessagesContext.Provider>
  );
}

export function useMessages(): MessagesContextValue {
  const context = useContext(MessagesContext);
  if (!context)
    throw new Error("useMessage must be used within MessageProvider");
  return context;
}

export function useListenMessage<Type extends Message.ServerType>(
  type: Type,
  handler: VscMessageHandler<Type>,
  deps: DependencyList,
) {
  const { useListen } = useMessages();
  useListen(type, handler, deps);
}

export function useSendMessage(message: Message.Client, deps?: DependencyList) {
  const { send } = useMessages();
  useEffect(() => send(message), [send, ...(deps ?? [])]);
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
