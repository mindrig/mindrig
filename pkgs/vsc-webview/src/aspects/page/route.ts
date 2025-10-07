import { Page } from "@wrkspc/core/page";

export type PageHrefs = {
  [Key in Page.Type]: PageHref.Builder<Key>;
};

export namespace PageHref {
  // TODO: Derive params from the page types here
  export type Builder<_Type extends Page.Type> = () => string;
}

export const pageHrefs: PageHrefs = {
  playground: () => "/",
  auth: () => "/auth",
};

export const defaultPageHref = () => pageHrefs.playground();
