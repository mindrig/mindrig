export interface Settings {
  playground?: Settings.Playground | undefined;
}

export namespace Settings {
  export interface Playground {
    showSource?: boolean | undefined;
    parallelRequests?: number | undefined;
  }
}
