import { Description, Icon, Label, textCn } from "@wrkspc/ds";
import iconSolidQuestionCircle from "@wrkspc/icons/svg/solid/question-circle.js";

export namespace SetupSettingsSection {
  export interface Props {
    header: string;
    description: string;
  }
}

export function SetupSettingsSection(
  props: React.PropsWithChildren<SetupSettingsSection.Props>,
) {
  const { header: title, description, children } = props;

  return (
    <div className="flex flex-col gap-3 pb-3 last:pb-0">
      <div className="flex flex-col gap-1">
        <h5
          className={textCn({
            role: "subheader",
            size: "xsmall",
            className: "flex items-center gap-1",
          })}
        >
          {props.header}
        </h5>

        <Description size="small">{description}</Description>
      </div>

      <div className="grid grid-cols-2 gap-3">{children}</div>
    </div>
  );
}

export namespace SetupSettingsLabelWithDescription {
  export interface Props {
    label: string;
    description?: string | undefined;
  }
}

export function SetupSettingsLabelWithDescription(
  props: SetupSettingsLabelWithDescription.Props,
) {
  const { label, description } = props;

  return (
    <div className="flex items-center gap-1" title={description}>
      <Label size="small">{label}</Label>

      <div className="inline-flex">
        <Icon id={iconSolidQuestionCircle} size="xsmall" color="detail" />
      </div>
    </div>
  );
}

export function setupSettingsLabelWithDescription(
  props: SetupSettingsLabelWithDescription.Props,
) {
  const { label, description } = props;
  return {
    label: (
      <SetupSettingsLabelWithDescription
        label={label}
        description={description}
      />
    ),
    a11y: "Maximum output tokens",
  };
}
