export function isReactElement(value: unknown): value is React.ReactElement {
  return (
    typeof value === "object" &&
    !!value &&
    // TODO: Figure out if it's safe to check that `value.$$typeof.toString()`
    // starts with "Symbol(react.".
    "$$typeof" in value &&
    "type" in value &&
    "key" in value &&
    "props" in value
  );
}
