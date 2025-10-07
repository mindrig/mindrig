import { always, never } from "alwaysly";
import { AttachmentRequest } from "./request";

export interface AttachmentFilters {
  [key: string]: string[];
}

export function attachmentDialogTitle(
  modalities: AttachmentRequest.Modalities,
): string {
  let title = "file";
  if (modalities.length === 1) {
    always(modalities[0]);
    title = attachmentModalityName(modalities[0]);
  }

  return `Select ${title}`;
}

export interface AttachmentModalityTitleOptions {
  title?: boolean;
  plural?: boolean;
}

export function attachmentModalityName(
  modality: AttachmentRequest.Modality,
  options?: AttachmentModalityTitleOptions,
): string {
  switch (modality) {
    case "image":
      return `${options?.title ? "I" : "i"}mage${options?.plural ? "s" : ""}`;
    case "video":
      return `${options?.title ? "V" : "v"}ideo${options?.plural ? "s" : ""}`;
    case "audio":
      return `${options?.title ? "A" : "a"}udio${options?.plural ? "s" : ""}`;
    case "text":
      return `${options?.title ? "T" : "t"}ext file${options?.plural ? "s" : ""}`;
    case "pdf":
      return `PDF file${options?.plural ? "s" : ""}`;
    default:
      modality satisfies never;
      never();
  }
}

export function attachmentFilters(
  modalities: AttachmentRequest.Modalities,
): AttachmentFilters {
  let filters: AttachmentFilters = {};

  modalities.forEach((modality) => {
    filters[
      attachmentModalityName(modality, {
        title: true,
        plural: true,
      })
    ] = attachmentExts[modality];
  });

  // Put supported files first if multiple modalities
  if (modalities.length > 1)
    filters = {
      ["Supported files"]: [...new Set(Object.values(filters).flat())],
      ...filters,
    };

  // Add all files last
  filters["All files"] = ["*"];

  return filters;
}

export const attachmentExts = {
  image: ["png", "jpg", "jpeg", "gif", "webp"],
  video: ["mp4", "avi", "mov", "wmv"],
  audio: ["mp3", "wav", "m4a", "webm", "flac"],
  pdf: ["pdf"],
  text: ["txt", "md", "csv", "json"],
};
