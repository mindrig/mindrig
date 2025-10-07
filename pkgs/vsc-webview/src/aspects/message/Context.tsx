import { useVsc } from "@/aspects/vsc/Context";
import type { VscMessage } from "@wrkspc/vsc-message";
import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type DependencyList,
} from "react";
import { Message } from "./types";

export type VscMessageHandler<Type extends VscMessage.ExtensionType> = (
  message: VscMessage.Extension & { type: Type },
) => void;

export interface MessageSubscription {
  dispose(): void;
}

export interface MessageLoggerEntry {
  direction: "in" | "out";
  message: VscMessage;
}

export interface MessagesContextValue {
  send: (message: VscMessage.Webview) => void;

  listen: <Type extends VscMessage.ExtensionType>(
    type: Type,
    handler: VscMessageHandler<Type>,
  ) => MessageSubscription;

  useListen: <Type extends VscMessage.ExtensionType>(
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

const MessagesContext = createContext<MessagesContextValue | null>(null);

function narrowMessage(candidate: unknown): candidate is VscMessage {
  if (!candidate || typeof candidate !== "object") return false;
  if (typeof (candidate as { type?: unknown }).type !== "string") return false;
  return true;
}

export function MessagesProvider(
  props: PropsWithChildren<MessageProviderOptions>,
) {
  const { debug, logger, onUnhandledMessage, children } = props;
  const { vsc } = useVsc();
  type InternalHandler = (message: VscMessage.Extension) => void;
  const handlersRef = useRef(new Map<string, Set<InternalHandler>>());

  const listen = useCallback(
    <Type extends VscMessage.ExtensionType>(
      type: Type,
      handler: Message.Callback<Type>,
    ): MessageSubscription => {
      const bucket =
        handlersRef.current.get(type) ?? new Set<InternalHandler>();
      const wrapped: InternalHandler = (incoming) =>
        handler(incoming as VscMessage.Extension & { type: Type });

      bucket.add(wrapped);
      handlersRef.current.set(type, bucket);

      return {
        dispose: () => {
          const listeners = handlersRef.current.get(type);
          listeners?.delete(wrapped);
          if (listeners && listeners.size === 0)
            handlersRef.current.delete(type);
        },
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

  const useListen = <Type extends VscMessage.ExtensionType>(
    type: Type,
    handler: VscMessageHandler<Type>,
    deps: DependencyList = [],
  ) => {
    useEffect(() => {
      const subscription = listen(type, handler);
      return () => subscription.dispose();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [listen, type, handler, ...deps]);
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
    throw new Error("useMessage must be used within a MessageProvider");
  return context;
}

export function useMessage<Type extends VscMessage.ExtensionType>(
  type: Type,
  handler: VscMessageHandler<Type>,
  deps: DependencyList,
) {
  const { useListen } = useMessages();
  useListen(type, handler, deps);
}
