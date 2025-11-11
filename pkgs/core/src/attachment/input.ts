import { FileContent } from "../file";
import { Attachment } from "./attachment";

export interface AttachmentInput {
  path: Attachment.Path;
  base64: FileContent.Base64;
}
