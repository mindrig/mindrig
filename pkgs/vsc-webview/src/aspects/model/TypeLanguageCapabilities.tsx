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
    <Tags>
      {attachment && <Tag size="small">Attachments</Tag>}
      {toolCall && <Tag size="small">Tool call</Tag>}
      {reasoning && <Tag size="small">Reasoning</Tag>}
      {temperature && <Tag size="small">Reasoning</Tag>}
    </Tags>
  );
}
