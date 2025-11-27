import { Model } from "@wrkspc/core/model";
import { Tag, Tags } from "@wrkspc/ds";

export namespace SetupCapabilities {
  export interface Props {
    type: Model.TypeLanguage;
  }
}

export function ModelTypeLanguageCapabilities(props: SetupCapabilities.Props) {
  const {
    type: { capabilities },
  } = props;
  if (!capabilities) return null;

  const { attachment, toolCall, reasoning, temperature } = capabilities;

  return (
    <Tags size="xsmall">
      {attachment && (
        <Tag color="secondary" size="xsmall">
          Attachments
        </Tag>
      )}

      {toolCall && (
        <Tag color="secondary" size="xsmall">
          Tool call
        </Tag>
      )}

      {reasoning && (
        <Tag color="secondary" size="xsmall">
          Reasoning
        </Tag>
      )}

      {temperature && (
        <Tag color="secondary" size="xsmall">
          Reasoning
        </Tag>
      )}
    </Tags>
  );
}
