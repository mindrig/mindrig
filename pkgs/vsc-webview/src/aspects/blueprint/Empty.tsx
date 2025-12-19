import { EditorFile } from "@wrkspc/core/editor";
import { Icon, textCn } from "@wrkspc/ds";
import iconRegularFileBan from "@wrkspc/icons/svg/regular/file-ban.js";
import iconRegularHandPointer from "@wrkspc/icons/svg/regular/hand-pointer.js";
import iconRegularLightbulb from "@wrkspc/icons/svg/regular/lightbulb.js";
import iconSolidPlay from "@wrkspc/icons/svg/solid/play.js";
import { Block, Button } from "@wrkspc/ui";
import { State } from "enso";
import { useMessages } from "../message/Context";
import { PageEmpty } from "../page/Empty";
import { PlaygroundPromptSelector } from "../playground/PromptSelector";

export namespace BlueprintEmpty {
  export interface Props {
    fileState: State<EditorFile.Meta>;
  }
}

export function BlueprintEmpty(props: BlueprintEmpty.Props) {
  const { fileState } = props;
  const { sendMessage } = useMessages();

  const isUnknown = fileState.$.languageId.useCompute(
    (langId) => langId === "unknown",
    [],
  );

  return (
    <PageEmpty
      icon={isUnknown ? iconRegularFileBan : iconRegularHandPointer}
      label={isUnknown ? "Unsupported file type" : "No prompt selected"}
      description={
        isUnknown
          ? "The parser doesn't currently support the file type."
          : "Focus a prompt in the source code to test it."
      }
      actions={
        <>
          <Button
            size="xsmall"
            onClick={() => sendMessage({ type: "playground-client-new-draft" })}
          >
            New Prompt Draft
          </Button>

          <span className={textCn({ size: "small", color: "detail" })}>or</span>

          <PlaygroundPromptSelector />
        </>
      }
      extra={
        <Block size="large" dir="y" align border="top" pad={{ top: "large" }}>
          {!isUnknown && (
            <Block dir="y" size="xsmall" align>
              <Block size="xsmall" align>
                <Icon id={iconRegularLightbulb} size="small" color="support" />
                <h3
                  className={textCn({
                    bold: true,
                    size: "small",
                    color: "detail",
                    align: "center",
                    balance: true,
                  })}
                >
                  Quick Tip
                </h3>
              </Block>

              <p
                className={textCn({
                  size: "small",
                  color: "detail",
                  align: "center",
                  balance: true,
                })}
              >
                To make Mind Rig detect prompts in your code, assign a string to
                a variable with <code>prompt</code> in name, or put an
                annotation comment <code>// @prompt</code> or{" "}
                <code>/* @prompt */</code> in front of a line or string.{" "}
                <a
                  href="https://mindrig.ai/docs/guides/prompts-detection/"
                  className="text-link hover:text-link-hover"
                >
                  Learn more
                </a>
              </p>
            </Block>
          )}

          <Button
            style="transparent"
            size="small"
            color="secondary"
            icon={iconSolidPlay}
            href="https://customer-bv8mebpmji0au64l.cloudflarestream.com/ba5393ecce333c057b323c448c029c0c/watch"
          >
            Watch video demo
          </Button>

          <p
            className={textCn({
              size: "small",
              color: "detail",
              align: "center",
              balance: true,
            })}
          >
            <a
              href="https://discord.gg/B2R9nHghq8"
              className="text-link hover:text-link-hover"
            >
              Join Discord
            </a>{" "}
            or leave feedback{" "}
            <a
              href="https://github.com/mindrig/mindrig"
              className="text-link hover:text-link-hover"
            >
              on GitHub
            </a>{" "}
            to help us make Mind Rig better!
          </p>
        </Block>
      }
    />
  );
}
