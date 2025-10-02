export type VscMessageLifecycle = VscMessageLifecycle.WebviewReady;

export namespace VscMessageLifecycle {
  export interface WebviewReady {
    type: "lifecycle-webview-ready";
    payload?: undefined;
  }
}
