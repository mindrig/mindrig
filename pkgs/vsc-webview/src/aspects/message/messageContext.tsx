import {
  PropsWithChildren,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type DependencyList,
} from "react";
import type { VscMessage } from "@wrkspc/vsc-message";
import { useVsc } from "@/aspects/vsc/Context";

export type VscMessageHandler<K extends VscMessage["type"]> = (
  message: Extract<VscMessage, { type: K }>,
) => void;

export interface MessageSubscription {
  dispose(): void;
}

export interface MessageLoggerEntry {
  direction: "in" | "out";
  message: VscMessage;
}

export interface MessageContextValue {
  send: (message: VscMessage) => void;
  listen: <K extends VscMessage["type"]>(
    type: K,
    handler: VscMessageHandler<K>,
  ) => MessageSubscription;
  once: <K extends VscMessage["type"]>(
    type: K,
  ) => Promise<Extract<VscMessage, { type: K }>>;
  useOn: <K extends VscMessage["type"]>(
    type: K,
    handler: VscMessageHandler<K>,
    deps?: DependencyList,
  ) => void;
  useOnce: <K extends VscMessage["type"]>(
    type: K,
    handler: VscMessageHandler<K>,
    deps?: DependencyList,
  ) => void;
}

export interface MessageProviderOptions {
  debug?: boolean;
  logger?: (entry: MessageLoggerEntry) => void;
  onUnhandledMessage?: (message: unknown) => void;
}

const MessageContext = createContext<MessageContextValue | null>(null);

function narrowMessage(candidate: unknown): candidate is VscMessage {
  if (!candidate || typeof candidate !== "object") return false;
  if (typeof (candidate as { type?: unknown }).type !== "string") return false;
  return true;
}

export function MessageProvider({
  children,
  debug = import.meta.env?.VITE_MINDRIG_DEBUG_MESSAGES === "true",
  logger,
  onUnhandledMessage,
}: PropsWithChildren<MessageProviderOptions>) {
  const { vsc } = useVsc();
  type InternalHandler = (message: VscMessage) => void;
  const handlersRef = useRef(new Map<string, Set<InternalHandler>>());

  const listen = useCallback(
    <K extends VscMessage["type"]>(
      type: K,
      handler: VscMessageHandler<K>,
    ): MessageSubscription => {
      const bucket =
        handlersRef.current.get(type) ?? new Set<InternalHandler>();
      const wrapped: InternalHandler = (incoming) =>
        handler(incoming as Extract<VscMessage, { type: K }>);

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

  const send = useCallback<MessageContextValue["send"]>(
    (message) => {
      logger?.({ direction: "out", message });
      vsc.postMessage?.(message);
    },
    [logger, vsc],
  );

  const once = useCallback(
    <K extends VscMessage["type"]>(type: K) =>
      new Promise<Extract<VscMessage, { type: K }>>((resolve) => {
        const subscription = listen(type, (message) => {
          subscription.dispose();
          resolve(message);
        });
      }),
    [listen],
  );

  const useOnHook = useCallback(
    <K extends VscMessage["type"]>(
      type: K,
      handler: VscMessageHandler<K>,
      deps: DependencyList = [],
    ) => {
      useEffect(() => {
        const subscription = listen(type, handler);
        return () => subscription.dispose();
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [listen, type, handler, ...deps]);
    },
    [listen],
  );

  const useOnceHook = useCallback(
    <K extends VscMessage["type"]>(
      type: K,
      handler: VscMessageHandler<K>,
      deps: DependencyList = [],
    ) => {
      useEffect(() => {
        let disposed = false;
        const subscription = listen(type, (message) => {
          if (disposed) return;
          subscription.dispose();
          handler(message as Extract<VscMessage, { type: K }>);
        });

        return () => {
          disposed = true;
          subscription.dispose();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [listen, type, handler, ...deps]);
    },
    [listen],
  );

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

      for (const handler of Array.from(listeners)) {
        try {
          handler(payload as never);
        } catch (error) {
          console.error(
            `Message handler for ${payload.type} threw an error`,
            error,
          );
        }
      }
    };

    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("message", handleMessage);
      handlersRef.current.clear();
    };
  }, [debug, logger, onUnhandledMessage]);

  const value = useMemo<MessageContextValue>(
    () => ({ send, listen, once, useOn: useOnHook, useOnce: useOnceHook }),
    [send, listen, once, useOnHook, useOnceHook],
  );

  return (
    <MessageContext.Provider value={value}>{children}</MessageContext.Provider>
  );
}

export function useMessage(): MessageContextValue {
  const context = useContext(MessageContext);
  if (!context)
    throw new Error("useMessage must be used within a MessageProvider");
  return context;
}

export function useOn<K extends VscMessage["type"]>(
  type: K,
  handler: VscMessageHandler<K>,
  deps: DependencyList = [],
) {
  const { useOn } = useMessage();
  useOn(type, handler, deps);
}

export function useOnce<K extends VscMessage["type"]>(
  type: K,
  handler: VscMessageHandler<K>,
  deps: DependencyList = [],
) {
  const { useOnce } = useMessage();
  useOnce(type, handler, deps);
}
