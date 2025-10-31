export namespace FileContent {
  export type Base64 = string & { [base64Brand]: true };
  declare const base64Brand: unique symbol;
}
