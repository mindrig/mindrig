export namespace Vsc {
  export type AcquireApi = () => Api;

  export interface Api {
    postMessage: (message: any) => void;
    getState: () => any;
    setState: (state: any) => void;
  }
}
