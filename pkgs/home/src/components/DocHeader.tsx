import { textCn } from "@wrkspc/theme";

export interface DocHeaderProps {
  category: string;
  title: string;
  subtitle?: string | undefined;
}

export function DocHeader(props: DocHeaderProps) {
  const { title, category, subtitle } = props;

  return (
    <header className="border-b border-gray-300 bg-gray-50 w-full">
      <div className="mx-auto w-full max-w-2xl space-y-3 py-6 px-4 md:py-10">
        <p
          className={textCn({
            role: "body",
            color: "detail",
            size: "large",
            leading: "none",
          })}
        >
          {category}
        </p>

        <h1 className={textCn({ role: "header", size: "large" })}>{title}</h1>

        {subtitle && (
          <p
            className={textCn({
              role: "subheader",
              size: "large",
              color: "support",
            })}
          >
            {subtitle}
          </p>
        )}
      </div>
    </header>
  );
}
