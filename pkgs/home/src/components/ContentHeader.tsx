import { textCn } from "@wrkspc/theme";

export interface ContentHeaderProps {
  title: string;
  subtitle?: string | undefined;
  publishedAt?: Date | undefined;
}

export function ContentHeader(props: ContentHeaderProps) {
  const { title, publishedAt, subtitle } = props;

  return (
    <header className="border-b border-gray-300 bg-gray-50 w-full">
      <div className="mx-auto w-full max-w-3xl space-y-3 py-8 px-4 md:py-20 text-center">
        {publishedAt && (
          <time
            dateTime={publishedAt.toISOString()}
            className={textCn({
              role: "body",
              color: "detail",
              size: "large",
              className: "block",
            })}
          >
            {publishedAt.toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
        )}

        <h1 className={textCn({ role: "header", size: "xlarge" })}>{title}</h1>

        {subtitle && (
          <p
            className={textCn({
              role: "subheader",
              size: "xlarge",
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
