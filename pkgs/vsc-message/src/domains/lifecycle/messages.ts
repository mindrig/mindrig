export type VscMessageLifecycle = VscMessageLifecycle.WebviewReady;

export namespace VscMessageLifecycle {
  export type Type = "lifecycle-webview-ready";

  export interface WebviewReady {
    type: "lifecycle-webview-ready";
    payload?: undefined;
  }
}
