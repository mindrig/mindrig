import { Datasource } from "../datasource";

export function datasourceInputToValues(
  datasourcesInput: Datasource.Input[],
): Datasource.Values {
  const values: Datasource.Values = {};
  datasourcesInput.forEach((input) => Object.assign(values, input.values));
  return values;
}
