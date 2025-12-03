import { FileInfo } from "@wrkspc/core/file";
import { Icon, textCn } from "@wrkspc/ds";
import React, { Fragment, ReactNode } from "react";
import { FileInfoComponent } from "./Info";

export namespace FilePreviewComponent {
  export interface Props {
    icon: ReactNode;
    info: FileInfo;
    actions?: ReactNode | undefined;
    meta?: MetaEntry[] | undefined;
  }

  export type MetaEntry = string | MetaEntryObject;

  export interface MetaEntryObject {
    icon?: Icon.Prop | undefined;
    label: React.ReactNode;
  }
}

export function FilePreviewComponent(props: FilePreviewComponent.Props) {
  const { icon, info, actions, meta } = props;

  return (
    <div className="flex gap-1">
      <div className="shrink-0">{icon}</div>

      <div className="flex flex-col gap-1 grow">
        <FileInfoComponent info={info} actions={actions} />

        {meta?.length && (
          <div
            className={textCn({
              size: "xsmall",
              color: "support",
              className: "leading-none flex gap-1",
            })}
          >
            {meta.map((entry, index) =>
              index ? (
                <Fragment key={index}>
                  {" "}
                  • <MetaEntry entry={entry} />
                </Fragment>
              ) : (
                <MetaEntry entry={entry} key={index} />
              ),
            )}
          </div>
        )}
      </div>
    </div>
  );
}

namespace MetaEntry {
  export interface Props {
    entry: FilePreviewComponent.MetaEntry;
  }
}

export function MetaEntry(props: MetaEntry.Props) {
  const { entry } = props;

  if (typeof entry === "string") {
    return <>{entry}</>;
  }

  const { icon, label } = entry;

  return (
    <span className="flex items-center gap-1">
      {icon && <Icon id={icon} size="xsmall" color="detail" />}
      <span>{label}</span>
    </span>
  );
}
