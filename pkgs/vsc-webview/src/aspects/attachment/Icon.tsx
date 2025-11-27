import { Icon, IconId, IconProps } from "@wrkspc/icons";
import iconRegularFileContract from "@wrkspc/icons/svg/regular/file-contract.js";
import iconRegularFileSpreadsheet from "@wrkspc/icons/svg/regular/file-spreadsheet.js";
import iconRegularFile from "@wrkspc/icons/svg/regular/file.js";
import iconRegularImage from "@wrkspc/icons/svg/regular/image.js";
import { LanguageIcon } from "../language/Icon";

export namespace AttachmentIcon {
  export interface Props extends Omit<IconProps, "id"> {
    mime: string;
  }
}

export function AttachmentIcon(props: AttachmentIcon.Props) {
  const { mime, ...iconProps } = props;

  switch (mime) {
    case "text/typescript":
      return <LanguageIcon id="ts" {...iconProps} size="small" />;
    case "text/javascript":
      return <LanguageIcon id="js" {...iconProps} size="small" />;
    case "text/python":
      return <LanguageIcon id="py" {...iconProps} size="small" />;
  }

  return <Icon {...iconProps} id={attachmentIconId(mime)} size="small" />;
}

export function attachmentIconId(mime: string): IconId {
  if (mime.startsWith("image/")) return iconRegularImage;

  switch (mime) {
    case "text/csv":
      return iconRegularFileSpreadsheet;
    case "application/pdf":
      return iconRegularFileContract;
  }

  return iconRegularFile;
}
