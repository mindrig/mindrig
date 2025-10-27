import { textCn } from "@wrkspc/theme";
import { DownloadForm } from "./DownloadForm";
import { LandingBlockHeader } from "./shared/LandingBlock";

export function Demo() {
  return (
    <div className="bg-gray-900 w-full py-16">
      <div className="mx-auto max-w-7xl flex flex-col items-center gap-6">
        <LandingBlockHeader
          label="The problem"
          title="TODO: Demo of the extension"
          labelColor="text-yellow-500"
          inverse
        >
          TODO: The demo of the extension featuring the problem and the
          extension as the solution.
        </LandingBlockHeader>

        <div className="text-gray-500">TODO: Screenshot/video goes here</div>

        <div className="space-y-4 text-center">
          <div
            className={textCn({
              role: "header",
              inverse: true,
            })}
          >
            TODO: Value proposition headline
          </div>

          <div
            className={textCn({
              role: "subheader",
              color: "support",
              inverse: true,
            })}
          >
            TODO: Supporting text detailing how the extension solves the
            problem.
          </div>
        </div>

        <DownloadForm inverse />
      </div>
    </div>
  );
}
