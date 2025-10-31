import { DatasourceManual } from "@wrkspc/core/datasource";
import { Field } from "enso";

export { DatasourceManualComponent as DatasourceManual };

export namespace DatasourceManualComponent {
  export interface Props {
    field: Field<DatasourceManual>;
  }
}

export function DatasourceManualComponent(
  props: DatasourceManualComponent.Props,
) {
  const { field } = props;
  return <div>TODO</div>;
}

{
  /* {inputSource === "manual" && hasVariables && (
        <div className="space-y-3">
          <h5 className="text-sm font-medium">Variables</h5>
          {(promptVariables ?? []).map((variable) => (
            <div key={variable.exp} className="space-y-1">
              <label className="block text-sm font-medium">
                {variable.exp}
              </label>
              <input
                type="text"
                value={variables[variable.exp] || ""}
                onChange={(event) =>
                  handleVariableChange(variable.exp, event.target.value)
                }
                className="w-full px-3 py-2 border rounded focus:outline-none text-sm"
                placeholder={`Enter value for ${variable.exp}`}
              />
            </div>
          ))}
        </div>
      )} */
}
