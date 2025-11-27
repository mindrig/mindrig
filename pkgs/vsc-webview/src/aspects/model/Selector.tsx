import { mapModelItems, providerLogoUrl } from "@wrkspc/core/model";
import { Setup } from "@wrkspc/core/setup";
import { SelectController } from "@wrkspc/ds";
import { Field } from "enso";
import { useModelsMap } from "./MapContext";

export namespace ModelSelector {
  export interface Props {
    field: Field<Setup.Ref>;
  }
}

export function ModelSelector(props: ModelSelector.Props) {
  const { field } = props;
  const { modelsPayload: modelsPayload, useModels } = useModelsMap();

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
    <div className="grid grid-cols-2 gap-2">
      <SelectController
        field={developerIdField}
        label={{ a11y: "Select model provider" }}
        options={
          modelsPayload?.developers?.map((option) => {
            const logoHref = providerLogoUrl(option.id);
            return {
              label: option.name,
              value: option.id,
              icon: { type: "svg", href: logoHref },
            };
          }) || []
        }
        placeholder="Select developer..."
        size="xsmall"
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
        size="xsmall"
        // isDisabled={!!disabled}
        // errors={modelError}
      />
    </div>
  );
}
