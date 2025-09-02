/**
 * Sync resource identifier.
 */
export type SyncResource = SyncResource.Code;

export namespace SyncResource {
  /**
   * Code file resource.
   */
  export interface Code {
    type: "code";
    /** Absolute or workspace-relative path to the file. */
    path: string;
  }
}
