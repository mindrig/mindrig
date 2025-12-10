import {
  buildModelsMap,
  mapModelDeveloperItems,
  mapModelItems,
  Model,
  ModelDeveloper,
  ModelDotdev,
  ModelGateway,
} from "@wrkspc/core/model";
import { createContext, useCallback, useContext, useMemo } from "react";
import { ModelsSource, useModelsSource } from "./SourceContext";

export namespace ModelsMapContext {
  export interface Value {
    modelsPayload: PayloadValue;
    sources: Sources;
    useModels: UseModels;
    useModel: UseModel;
  }

  export type UseModels = (
    developerId: ModelDeveloper.Id | undefined | null,
  ) => Model.Items | undefined;

  export type UseModel = (
    ref: Model.Ref | undefined | null,
  ) => Model | undefined | null;

  export interface Sources {
    dotdev: ModelsSource<"dotdev">;
    gateway: ModelsSource<"gateway">;
  }

  export type PayloadValue = Payload | undefined;

  export type Payload = PayloadOk | PayloadError;

  export interface PayloadOk {
    status: "ok";
    map: Model.ModelsMap;
    developers: ModelDeveloper.Items;
    meta: MetaValue;
  }

  export interface PayloadError {
    status: "error";
    message: string;
    map?: undefined;
    developers?: undefined;
    meta?: undefined;
  }

  export interface Selection {
    developerId: ModelDeveloper.Id;
    models: Model.Items;
    modelId: Model.Id | undefined;
  }

  export type MetaValue = Meta | undefined;

  export type Meta = MetaOk | MetaError;

  export interface MetaOk {
    status: "ok";
  }

  export interface MetaError {
    status: "error";
    message: string;
  }
}

const ModelsMapContext = createContext<ModelsMapContext.Value | undefined>(
  undefined,
);

export function ModelsMapProvider(props: React.PropsWithChildren) {
  const dotdev = useModelsSource("dotdev");
  const gateway = useModelsSource("gateway");

  const modelsPayload = useMemo<ModelsMapContext.PayloadValue>(() => {
    // Gateway is still loading
    if (!gateway.response) return undefined;

    if (gateway.response.data.status === "error") {
      return {
        status: "error",
        message: gateway.response.data.message,
      };
    }

    const gatewayOk = gateway.response as ModelGateway.ListResponseOk;

    // Resolve models.dev value

    let dotdevOk: ModelDotdev.ListResponseOkValue;
    let meta: ModelsMapContext.MetaValue;
    if (dotdev.response) {
      if (dotdev.response.data.status === "error") {
        meta = {
          status: "error",
          message: dotdev.response.data.message,
        };
        dotdevOk = null;
      } else {
        meta = { status: "ok" };
        dotdevOk = dotdev.response as ModelDotdev.ListResponseOk;
      }
    }

    const map = buildModelsMap({
      gateway: gatewayOk,
      dotdev: dotdevOk,
    });
    const developers = mapModelDeveloperItems(map);

    const payload: ModelsMapContext.PayloadOk = {
      status: "ok",
      map,
      developers,
      meta,
    };
    return payload;
  }, [gateway, dotdev]);

  const useModels = useCallback<ModelsMapContext.UseModels>(
    (developerId) =>
      useMemo<Model.Items | undefined>(
        () =>
          modelsPayload?.map && developerId
            ? mapModelItems(modelsPayload.map, developerId)
            : undefined,
        [modelsPayload?.map, developerId],
      ),
    [modelsPayload?.map],
  );

  const useModel = useCallback<ModelsMapContext.UseModel>(
    (ref) =>
      useMemo<Model | undefined | null>(
        () =>
          ref &&
          modelsPayload?.map?.[ref.developerId].models.find(
            (model) => model.id === ref.modelId,
          ),
        [modelsPayload?.map, ref?.developerId, ref?.modelId],
      ),
    [modelsPayload?.map],
  );

  const value: ModelsMapContext.Value = {
    modelsPayload,
    useModels,
    useModel,
    sources: { dotdev, gateway },
  };

  return (
    <ModelsMapContext.Provider value={value}>
      {props.children}
    </ModelsMapContext.Provider>
  );
}

export function useModelsMap(): ModelsMapContext.Value {
  const value = useContext(ModelsMapContext);
  if (!value) throw new Error("useModels must be used within ModelsProvider");
  return value;
}
