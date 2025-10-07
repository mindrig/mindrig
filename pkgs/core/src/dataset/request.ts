export namespace DatasetRequest {
  export type CsvId = string & { [csvIdBrand]: true };
  declare const csvIdBrand: unique symbol;
}
