import {
  buildModelsMap,
  mapModelDeveloperItems,
  Model,
  ModelDeveloper,
  ModelDotdev,
  ModelGateway,
} from "@wrkspc/core/model";
import { createContext, useContext, useMemo, useState } from "react";
import { useModelsSource } from "./source";

export namespace ModelsContext {
  export type Value = PayloadOk | PayloadError | undefined;

  export interface PayloadOk {
    status: "ok";
    map: Model.ModelsMap;
    developers: ModelDeveloper.Items;
    meta: MetaValue;
    // selection?: Selection | undefined;
    // setDeveloperId(developerId: ModelDeveloper.Id | undefined): void;
  }

  export interface PayloadError {
    status: "error";
    message: string;
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

const ModelsContext = createContext<ModelsContext.Value | undefined>(undefined);

export function ModelsProvider(props: React.PropsWithChildren) {
  const dotdev = useModelsSource("dotdev");
  const gateway = useModelsSource("gateway");
  const [developerId, setDeveloperId] = useState<
    ModelDeveloper.Id | undefined
  >();

  const value = useMemo<ModelsContext.Value>(() => {
    // Gateway is still loading
    if (!gateway.response) return undefined;

    if (gateway.response.data.status === "error") {
      return {
        status: "error",
        message: gateway.response.data.message,
      };
    }

    const gatewayOk = gateway.response as ModelGateway.ListResponseOk;

    let dotdevOk: ModelDotdev.ListResponseOkValue;
    let meta: ModelsContext.MetaValue;
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

    const map = buildModelsMap(gatewayOk, dotdevOk);

    const developers = mapModelDeveloperItems(map);

    const value: ModelsContext.PayloadOk = {
      status: "ok",
      map,
      developers,
      meta,
      // setDeveloperId,
    };
    return value;
  }, [gateway, dotdev, setDeveloperId]);

  // useMemo(() => {
  //   if (value?.status !== "ok") return;

  //   const developer = developerId && value.map[developerId];

  //   if (!developer) {
  //     value.selection = undefined;
  //   } else {
  //     const models = mapModelItems(value.map, developerId);
  //     value.selection = {
  //       developerId,
  //       models,
  //       modelId: models[0]?.id,
  //     };
  //   }
  // }, [value, developerId]);

  return (
    <ModelsContext.Provider value={value}>
      {props.children}
    </ModelsContext.Provider>
  );
}

export function useModels(): ModelsContext.Value {
  const value = useContext(ModelsContext);
  if (!value) throw new Error("useModels must be used within a ModelsProvider");
  return value;
}

//#region Legacy

export interface AvailableModel {
  id: string;
  name?: string;
  modelType?: string | null;
  specification?: { provider?: string };
  pricing?: Record<string, number>;
}

//#endregion
