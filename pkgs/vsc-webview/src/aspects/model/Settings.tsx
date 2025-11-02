import { Model, ModelSettings } from "@wrkspc/core/model";
import { Field } from "enso";
import { ModelTypeLanguageSettings } from "./TypeLanguageSettings";

export { ModelSettingsComponent as ModelSettings };

export namespace ModelSettingsComponent {
  export interface Props {
    field: Field<ModelSettings>;
    type: Model.Type;
  }
}

function ModelSettingsComponent(props: ModelSettingsComponent.Props) {
  const { field, type } = props;

  switch (type.type) {
    case "language":
      return <ModelTypeLanguageSettings field={field} type={type} />;

    default:
      return null;
  }
}
