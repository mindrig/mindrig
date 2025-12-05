import { always } from "alwaysly";
import { nanoid } from "nanoid";
import {
  buildModelSettings,
  DEFAULT_MODEL_DEVELOPER_ID,
  Model,
  ModelSettings,
} from "../model";
import { Versioned } from "../versioned";

export type Setup = Setup.V1;

export namespace Setup {
  //#region Ids

  export type Id = string & { [idBrand]: true };
  declare const idBrand: unique symbol;

  //#endregion

  export interface V1 extends Versioned<1> {
    id: Id;
    ref: Setup.Ref;
    settings: ModelSettings;
  }

  export type Ref = RefDeveloper | RefModel;

  export interface RefDeveloper
    extends Versioned<1>,
      Model.RefPartialDeveloper {}

  export interface RefModel extends Versioned<1>, Model.RefPartialModel {}
}

export namespace buildSetup {
  export interface Props {
    modelsMap: Model.ModelsMap | undefined;
    usedModelRefs?: Model.Ref[] | undefined;
  }
}

export function buildSetup(props: buildSetup.Props): Setup {
  const { modelsMap, usedModelRefs } = props;

  const developerId = DEFAULT_MODEL_DEVELOPER_ID;
  let modelId: Model.Id | null = null;

  // Consume map values if defined
  if (modelsMap) {
    const developer = modelsMap[developerId];
    always(developer);
    const model = developer.models[0];
    always(model);
    modelId = model.id;

    if (
      usedModelRefs?.find(
        (ref) => ref.developerId === developerId && ref.modelId === modelId,
      )
    ) {
      // TODO: Instead of assigning the default model each time, find the next
      // recommended model and/or developer
    }
  }

  return {
    id: buildSetupId(),
    v: 1,
    ref: {
      v: 1,
      developerId,
      modelId,
    },
    settings: buildModelSettings(),
  };
}

export function buildSetupsModelRefs(setups: Setup[]): Model.Ref[] {
  const usedModelRefs: Model.Ref[] = [];
  setups.forEach((setup) => {
    const { developerId, modelId } = setup.ref;
    if (!developerId || !modelId) return;
    usedModelRefs.push({ developerId, modelId });
  });
  return usedModelRefs;
}

export function buildSetupId(): Setup.Id {
  return `setup-${nanoid()}` as Setup.Id;
}
