import type { ShouldExpandNodeInitially } from "@uiw/react-json-view";

export const shouldExpandNodeInitially: ShouldExpandNodeInitially<object> = (
  isExpanded,
  props,
) => {
  const { value, level } = props;
  const isArray = Array.isArray(value);
  const isObject = typeof value === "object" && value !== null && !isArray;
  if (isArray) return isExpanded || (Array.isArray(value) && value.length > 5);
  if (isObject && level > 3) return true;
  return isExpanded;
};
