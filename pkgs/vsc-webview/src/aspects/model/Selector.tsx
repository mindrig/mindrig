import { mapModelItems, ModelSetup } from "@wrkspc/core/model";
import { SelectController } from "@wrkspc/ds";
import { Field } from "enso";
import { useModelsMap } from "./MapContext";

export namespace ModelSelector {
  export interface Props {
    field: Field<ModelSetup.Ref>;
  }
}

export function ModelSelector(props: ModelSelector.Props) {
  const { field } = props;
  const { payload: modelsPayload, useModels } = useModelsMap();

  field.$.developerId.useWatch(
    (developerId) => {
      if (!developerId) return field.set({ v: 1, developerId, modelId: null });

      const models =
        modelsPayload?.map && mapModelItems(modelsPayload.map, developerId);
      field.set({
        v: 1,
        developerId,
        modelId: models?.[0]?.id || null,
      });
    },
    [modelsPayload?.map],
  );

  const developerId = field.$.developerId.useValue();
  const models = useModels(developerId);

  const developerIdField = field.$.developerId.useDefined("string");
  const modelIdField = field.$.modelId.useDefined("string");

  return (
    <div className="grid grid-cols-2 gap-3">
      <SelectController
        field={developerIdField}
        label={{ a11y: "Select model provider" }}
        options={
          modelsPayload?.developers?.map((option) => ({
            label: option.name,
            value: option.id,
          })) || []
        }
        placeholder="Select provider..."
        size="small"
        // isDisabled={!!disabled}
        // errors={...}
      />

      <SelectController
        field={modelIdField}
        label={{ a11y: "Select model" }}
        options={
          models?.map((option) => ({
            label: option.name,
            value: option.id,
          })) || []
        }
        placeholder="Select model..."
        size="small"
        // isDisabled={!!disabled}
        // errors={modelError}
      />
    </div>
  );
}
