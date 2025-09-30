import { FileLabel } from "@/aspects/file/Label";
import { Prompt } from "@mindrig/types";
import { Button } from "@wrkspc/ds";
import { Select } from "@wrkspc/form";
import iconRegularThumbtackAngle from "@wrkspc/icons/svg/regular/thumbtack-angle.js";
import iconSolidThumbtack from "@wrkspc/icons/svg/solid/thumbtack.js";
import { SyncFile } from "@wrkspc/vsc-sync";
import { cn } from "crab";
import { PanelSection } from "../panel/Section";

export namespace FileHeader {
  export interface Props {
    fileState: SyncFile.State | null;
    prompts: Prompt[];
    promptIdx: number | null;
    isPinned: boolean;
    isPinDisabled: boolean;
    onTogglePromptPin: () => void;
    onPromptSelect: (index: number) => void;
  }
}

export function FileHeader(props: FileHeader.Props) {
  const {
    fileState,
    prompts,
    promptIdx,
    isPinned,
    isPinDisabled,
    onTogglePromptPin,
    onPromptSelect,
  } = props;

  if (!fileState)
    return (
      <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="text-center text-gray-500">
          <div className="mb-2">📄</div>
          <p className="text-sm">No supported file open</p>
          <p className="text-xs text-gray-400 mt-1">
            Open a .ts, .tsx, .js, .jsx, .mjs, .mjsx, .cjs, or .cjsx file
          </p>
        </div>
      </div>
    );

  return (
    <PanelSection bordered pinned={isPinned}>
      {fileState && (
        <div className="flex items-center justify-between gap-2">
          <FileLabel file={fileState} isPinned={isPinned} />

          <div className="flex items-center gap-2">
            <Select
              label={{ a11y: "Select prompt" }}
              size="xsmall"
              selectedKey={promptIdx ?? null}
              options={prompts.map((prompt, index) => ({
                label: prompt.exp.slice(0, 15),
                value: index,
              }))}
              placeholder={prompts.length ? "Select prompt" : "No prompts"}
              isDisabled={!prompts.length}
              onSelectionChange={(idx) => {
                if (idx === null) return;
                onPromptSelect(Number(idx));
              }}
            />

            <div className={cn("inline-flex", isPinned && "text-active-text")}>
              <Button
                style="label"
                color={isPinned ? "current" : "secondary"}
                icon={isPinned ? iconSolidThumbtack : iconRegularThumbtackAngle}
                onClick={onTogglePromptPin}
                aria-pressed={isPinned}
                aria-label={isPinned ? "Unpin prompt" : "Pin prompt"}
              />
            </div>
          </div>
        </div>
      )}
    </PanelSection>
  );
}
