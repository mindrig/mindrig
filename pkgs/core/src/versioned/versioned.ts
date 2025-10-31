import type { $ } from "tdollar";

export interface Versioned<Version extends number> {
  v: Version;
}

export namespace Versioned {
  /**
   * Recursively resolves types to only include versioned object types.
   */
  export type Only<Type> = (
    $.Debrand<Type> extends object // Preserve branded primitives
      ? Type extends Array<infer Item>
        ? Only<Item>[] extends infer ArrayType extends any[]
          ? $.Is.Never<ArrayType[number]> extends true
            ? never
            : ArrayType
          : never
        : Type extends object
          ? $.Or<
              $.Is.Indexed<Type>,
              Type extends ReadonlyArray<any> ? true : false
            > extends true
            ? { [Key in keyof Type]: Only<$.Value.Normalize<Type, Key>> }
            : // Only allow versioned object types
              Type extends Versioned<number>
              ? {
                  [Key in keyof Type]: Only<$.Value.Normalize<Type, Key>>;
                } extends infer ObjectType extends object
                ? $.Has.NeverValue<ObjectType> extends true
                  ? OnlyErrorFields<ObjectType>
                  : ObjectType
                : never
              : Type extends object
                ? OnlyErrorObject
                : never
          : never
      : Type
  ) extends infer ResolvedType
    ? Type extends ResolvedType
      ? Type
      : ResolvedType
    : never;

  export type OnlyErrorFields<Type extends object> = OnlyError<
    [
      "Error: Can't store object with non-versioned values",
      $.Key.NeverValue<Type>,
    ]
  >;

  export type OnlyErrorObject =
    OnlyError<"Error: Can't store non-versioned object">;

  export interface OnlyError<Message> {
    [errorBrand]: Message;
  }
  declare const errorBrand: unique symbol;
}
