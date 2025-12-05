import { Model, ModelSettings } from "@wrkspc/core/model";
import { Field } from "enso";
import { SetupSettingsLanguage } from "./Language";

export namespace SetupSettings {
  export interface Props {
    field: Field<ModelSettings>;
    type: Model.Type;
  }
}

export function SetupSettings(props: SetupSettings.Props) {
  const { field, type } = props;

  switch (type.type) {
    case "language":
      return <SetupSettingsLanguage settingsField={field} modelType={type} />;

    default:
      return null;
  }
}
