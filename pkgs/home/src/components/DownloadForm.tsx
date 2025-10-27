import { Button } from "@wrkspc/ui";

export interface DownloadFormProps {
  inverse?: boolean;
}

export function DownloadForm(props: DownloadFormProps) {
  return (
    <div className="max-w-7xl w-full flex flex-col gap-4 items-center">
      <Button color="cta" size="large" href="#">
        Download at VS Code Marketplace
      </Button>
    </div>
  );
}
