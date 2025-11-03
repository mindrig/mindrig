export namespace ModelLanguage {
  export interface Payload {
    type: "language";
    content: Content;
  }

  export type Content = ContentText | ContentTextParts;

  export interface ContentText {
    type: "text";
    text: string;
  }

  export interface ContentTextParts {
    type: "text-parts";
    parts: string[];
  }
}
