import { textCn } from "@wrkspc/theme";
import { Block, Button } from "@wrkspc/ui";

export interface DownloadFormProps {
  inverse?: boolean;
}

export function DownloadForm(props: DownloadFormProps) {
  return (
    <Block dir="y" align>
      <h2
        className={textCn({
          role: "label",
          color: "support",
          size: "large",
        })}
      >
        Install Extension For:
      </h2>

      <Block justify align>
        <Button
          color="cta"
          size="large"
          href="https://marketplace.visualstudio.com/items?itemName=mindrig.vscode"
        >
          Visual Studio Code
        </Button>

        <span
          className={textCn({ role: "label", size: "small", color: "detail" })}
        >
          Or
        </span>

        <Button
          color="cta"
          size="large"
          href="https://open-vsx.org/extension/mindrig/vscode"
        >
          Cursor, Antigravity, etc.
        </Button>
      </Block>
    </Block>
  );
}
