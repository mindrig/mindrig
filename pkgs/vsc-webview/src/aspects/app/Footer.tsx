import { Icon, textCn } from "@wrkspc/ds";
import iconBrandsDiscord from "@wrkspc/icons/svg/brands/discord.js";
import iconBrandsGithub from "@wrkspc/icons/svg/brands/github.js";
import iconSolidBook from "@wrkspc/icons/svg/solid/book.js";
import { Block } from "@wrkspc/ui";

export function AppFooter() {
  return (
    <Block pad="medium" size="small" align justify>
      <a
        href="https://github.com/mindrig/mindrig"
        className="opacity-80 hover:opacity-100"
      >
        <Block size="xsmall" align>
          <Icon id={iconBrandsGithub} color="support" size="small" />
          <span className={textCn({ color: "support" })}>GitHub</span>
        </Block>
      </a>

      <span className={textCn({ color: "detail", className: "opacity-60" })}>
        •
      </span>

      <a
        href="https://discord.gg/B2R9nHghq8"
        className="opacity-80 hover:opacity-100"
      >
        <Block size="xsmall" align>
          <Icon id={iconBrandsDiscord} color="support" size="small" />
          <span className={textCn({ color: "support" })}>Discord</span>
        </Block>
      </a>

      <span className={textCn({ color: "detail", className: "opacity-60" })}>
        •
      </span>

      <a href="https://mindrig.ai" className="opacity-80 hover:opacity-100">
        <Block size="xsmall" align>
          <Icon id={iconSolidBook} color="support" size="small" />
          <span className={textCn({ color: "support" })}>Docs</span>
        </Block>
      </a>
    </Block>
  );
}
