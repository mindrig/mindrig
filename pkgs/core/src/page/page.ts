export type Page = Page.Playground | Page.Auth;

export namespace Page {
  export type Type = Page["type"];

  export interface Playground {
    type: "playground";
  }

  export interface Auth {
    type: "auth";
  }
}
