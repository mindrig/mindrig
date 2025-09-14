import { Select } from "@wrkspc/form";

export namespace ModelSelect {
  export interface Props {
    models: {
      id: string;
      name?: string;
      modelType?: string | null;
      specification?: { provider?: string };
    }[];
    vercelGatewayKey: string | null;
    modelsLoading: boolean;

    selectedModelId: string | null;
    onModelChange: (modelId: string | null) => void;
  }
}

export function ModelSelect(props: ModelSelect.Props) {
  const {
    models,
    vercelGatewayKey,
    modelsLoading,
    selectedModelId,
    onModelChange,
  } = props;
  return (
    <Select
      size="xsmall"
      selectedKey={selectedModelId ?? ""}
      onSelectionChange={(id) => {
        onModelChange(id as string | null);
      }}
      isDisabled={!vercelGatewayKey || modelsLoading || models.length === 0}
      label={{
        a11y: vercelGatewayKey
          ? modelsLoading
            ? "Loading models…"
            : "Select model"
          : "Set Vercel Gateway API key",
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
