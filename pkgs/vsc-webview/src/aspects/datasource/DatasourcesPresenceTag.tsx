import { Datasource } from "@wrkspc/core/datasource";
import { PlaygroundMap } from "@wrkspc/core/playground";
import { Icon } from "@wrkspc/icons";
import iconRegularCheck from "@wrkspc/icons/svg/regular/check.js";
import iconRegularQuestion from "@wrkspc/icons/svg/regular/question.js";
import { Tag } from "@wrkspc/ui";
import { always } from "alwaysly";
import { Field } from "enso";
import { useBlueprint } from "../blueprint/Context";

export namespace DatasourcesPresenceTag {
  export interface Props extends Tag.Props {
    datasourcesField: Field<Datasource[]>;
  }
}

export function DatasourcesPresenceTag(props: DatasourcesPresenceTag.Props) {
  const { promptState } = useBlueprint();
  const { datasourcesField, ...tagProps } = props;
  const varIds = promptState.$.prompt.$.vars.useCompute(
    (vars) => vars.map((var_) => var_.id),
    [],
  );

  const present: boolean = datasourcesField.useCompute(
    (datasources) => {
      // TODO: Make it universal once we support multiple datasources
      const datasource = datasources[0];
      always(datasource);

      switch (datasource.type) {
        case "dataset":
          return !!datasource.data;

        case "manual":
          const varsToFind = new Set(varIds);
          datasource.values.forEach((values) =>
            Object.entries(values).forEach(
              ([varId, value]) =>
                !!value &&
                varsToFind.delete(varId as PlaygroundMap.PromptVarId),
            ),
          );
          return varsToFind.size === 0;
      }
    },
    [varIds],
  );

  return (
    <Tag {...tagProps}>
      <Icon
        size={props.size}
        id={present ? iconRegularCheck : iconRegularQuestion}
      />
    </Tag>
  );
}
