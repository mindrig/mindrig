import type { PromptVar } from "@mindrig/types";

export interface DatasourceVariablesProps {
  promptVariables: PromptVar[] | undefined | null;
  variables: Record<string, string>;
  onVariableChange: (name: string, value: string) => void;
}

export function DatasourceVariables(props: DatasourceVariablesProps) {
  const { promptVariables, variables, onVariableChange } = props;
  if (!promptVariables || promptVariables.length === 0) return null;

  return (
    <div className="space-y-3">
      <h5 className="text-sm font-medium">Variables</h5>
      {promptVariables.map((variable) => (
        <div key={variable.exp} className="space-y-1">
          <label className="block text-sm font-medium">{variable.exp}</label>
          <input
            type="text"
            value={variables[variable.exp] || ""}
            onChange={(event) =>
              onVariableChange(variable.exp, event.target.value)
            }
            className="w-full px-3 py-2 border rounded focus:outline-none text-sm"
            placeholder={`Enter value for ${variable.exp}`}
          />
        </div>
      ))}
    </div>
  );
}
