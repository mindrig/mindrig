import { Select } from "@wrkspc/ui";

export namespace ModelSelect {
  export interface Props {
    models: {
      id: string;
      name?: string;
      modelType?: string | null;
      specification?: { provider?: string };
    }[];
    modelsLoading: boolean;
    selectedModelId: string | null;
    onModelChange: (modelId: string | null) => void;
  }
}

export function ModelSelect(props: ModelSelect.Props) {
  const { models, modelsLoading, selectedModelId, onModelChange } = props;

  return (
    <Select
      size="xsmall"
      value={selectedModelId ?? ""}
      onChange={(id) => {
        onModelChange(id as string | null);
      }}
      isDisabled={modelsLoading || models.length === 0}
      label={{
        a11y: modelsLoading ? "Loading models…" : "Select model",
      }}
      options={[
        {
          value: "",
          label: modelsLoading ? "Loading…" : "Choose model",
          // disabled: true
        },
        ...models.map((m) => ({
          label: m.name || m.id,
          value: m.id,
        })),
      ]}
    />
  );
}
