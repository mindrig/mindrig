import { Model } from "@wrkspc/core/model";
import { ModelTypeLanguageCapabilities } from "./TypeLanguageCapabilities";

export namespace ModelCapabilities {
  export interface Props {
    type: Model.Type;
  }
}

export function ModelCapabilities(props: ModelCapabilities.Props) {
  const { type } = props;

  switch (type.type) {
    case "language":
      return <ModelTypeLanguageCapabilities type={type} />;

    default:
      return null;
  }
}
