import { ModelDeveloper } from "./developer";

export interface ModelSetup {
  developerId: ModelDeveloper.Id | null;
}

export function buildModelSetup(): ModelSetup {
  return {
    developerId: null,
  };
}
