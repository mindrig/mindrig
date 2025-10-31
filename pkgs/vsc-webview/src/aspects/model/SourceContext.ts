import { ModelsMessage } from "@wrkspc/core/model";
import { useCallback, useState } from "react";
import { useMessages } from "../message/Context";

export interface ModelsSource<Type extends ModelsSource.Type> {
  response: ModelsSource.Response<Type> | undefined;
  waiting: boolean;
  refresh(): void;
}

export namespace ModelsSource {
  export type Type = "gateway" | "dotdev";

  export type ResponseMessage =
    | ModelsMessage.ServerGatewayResponse
    | ModelsMessage.ServerDotdevResponse;

  export type ExtensionMessageType = ResponseMessage["type"];

  export type RefreshMessage =
    | ModelsMessage.ClientGatewayRefresh
    | ModelsMessage.ClientDotdevRefresh;

  export type RefreshMessageType = RefreshMessage["type"];

  export type Message<Type extends ModelsSource.Type> = Type extends "gateway"
    ? ModelsMessage.ServerGatewayResponse
    : ModelsMessage.ServerDotdevResponse;

  export type Response<Type extends ModelsSource.Type> = Type extends "gateway"
    ? ModelsMessage.ServerGatewayResponse["payload"]
    : ModelsMessage.ServerDotdevResponse["payload"];
}

export namespace UseModelsSource {
  export interface Result<Type extends ModelsSource.Type> {
    state: ModelsSource<Type>;
  }
}

export function useModelsSource<Type extends ModelsSource.Type>(
  type: Type,
): ModelsSource<Type> {
  const { send, useListen } = useMessages();
  const [response, setResponse] = useState<
    ModelsSource.Response<Type> | undefined
  >(undefined);
  const [waiting, setWaiting] = useState(true);

  useListen(
    messageResponseType(type),
    (message) => {
      setWaiting(false);
      setResponse(message.payload as any);
    },
    [],
  );

  const refresh = useCallback(() => {
    setWaiting(true);
    send({ type: messageRefreshType(type) });
  }, []);

  return { response, waiting, refresh };
}

function messageResponseType(
  type: ModelsSource.Type,
): ModelsSource.ExtensionMessageType {
  // NOTE: We use switch instead of interpolation to enable find-and-replace.
  switch (type) {
    case "gateway":
      return "models-server-gateway-response";
    case "dotdev":
      return "models-server-dotdev-response";
  }
}

function messageRefreshType(
  type: ModelsSource.Type,
): ModelsSource.RefreshMessageType {
  // NOTE: We use switch instead of interpolation to enable find-and-replace.
  switch (type) {
    case "gateway":
      return "models-client-gateway-refresh";
    case "dotdev":
      return "models-client-dotdev-refresh";
  }
}
