import { ModelsMessage } from "@wrkspc/core/model";
import { State } from "enso";
import { useCallback } from "react";
import { useAppState } from "../app/state/Context";
import { useMessages } from "../message/Context";
import { ModelsAppState } from "./modelsAppState";

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
  const { sendMessage, useListen } = useMessages();
  const { appState } = useAppState();
  const modelsState = appState.$.models.$[type] as State<ModelsAppState.Any>;

  useListen(
    messageResponseType(type),
    (message) => {
      modelsState.$.waiting.set(false);
      modelsState.$.payload.set(message.payload as any);
    },
    [],
  );

  const refresh = useCallback(() => {
    modelsState.$.waiting.set(true);
    sendMessage({ type: messageRefreshType(type) });
  }, []);

  const response = modelsState.$.payload.useValue();
  const waiting = modelsState.$.waiting.useValue();

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
