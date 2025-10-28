import {
  act,
  fireEvent,
  render,
  renderHook,
  screen,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import type { AvailableModel } from "@/aspects/model/Context";

import {
  ModelSetups,
  useModelSetupsState,
  type ModelCapabilities,
  type ModelConfig,
} from "../Setups";

describe.skip("ModelSetups", () => {
  it("renders settings for expanded configuration and triggers callbacks", async () => {
    const user = userEvent.setup();
    const config: ModelConfig = {
      key: "config-1",
      providerId: "openai",
      modelId: "gpt-4",
      label: "GPT-4",
      generationOptions: {},
      reasoning: { enabled: true, effort: "medium", budgetTokens: "" },
      toolsJson: "",
      providerOptionsJson: "{}",
      attachments: [
        {
          path: "file.txt",
          name: "file.txt",
          mime: "text/plain",
        },
      ],
    };

    const caps: ModelCapabilities = {
      supportsImages: true,
      supportsVideo: false,
      supportsFiles: true,
      supportsTools: true,
      supportsReasoning: true,
      provider: "openai",
    };

    const props = {
      status: "success" as const,
      modelsLoading: false,
      modelsError: null,
      configs: [config],
      errors: { "config-1": {} },
      expandedKey: "config-1",
      providerOptions: [{ id: "openai", label: "OpenAI" }],
      getModelOptions: vi
        .fn()
        .mockReturnValue([{ id: "gpt-4", label: "GPT-4" }]),
      getCapabilities: vi.fn().mockReturnValue(caps),
      onAddModel: vi.fn(),
      onRemoveModel: vi.fn(),
      onToggleExpand: vi.fn(),
      onProviderChange: vi.fn(),
      onModelChange: vi.fn(),
      onGenerationOptionChange: vi.fn(),
      onReasoningChange: vi.fn(),
      onToolsJsonChange: vi.fn(),
      onProviderOptionsJsonChange: vi.fn(),
      onRequestAttachments: vi.fn(),
      onClearAttachments: vi.fn(),
      addDisabled: false,
    };

    render(<ModelSetups {...props} />);

    expect(screen.getByText("Model")).toBeInTheDocument();
    expect(screen.getByText("Attach Files")).toBeInTheDocument();
    expect(screen.getByText("Tools (JSON)")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Attach Files" }));
    expect(props.onRequestAttachments).toHaveBeenCalledWith("config-1");

    await user.click(screen.getByRole("button", { name: "Clear" }));
    expect(props.onClearAttachments).toHaveBeenCalledWith("config-1");

    fireEvent.change(screen.getByPlaceholderText("null"), {
      target: { value: "{}" },
    });
    expect(props.onToolsJsonChange).toHaveBeenLastCalledWith("config-1", "{}");

    fireEvent.change(screen.getByPlaceholderText("{}"), {
      target: { value: '{"mode":"fast"}' },
    });
    expect(props.onProviderOptionsJsonChange).toHaveBeenLastCalledWith(
      "config-1",
      '{"mode":"fast"}',
    );
  });

  it("disables add button when requested", () => {
    render(
      <ModelSetups
        status="loading"
        modelsLoading
        modelsError={null}
        configs={[]}
        errors={{}}
        expandedKey={null}
        providerOptions={[]}
        getModelOptions={() => []}
        getCapabilities={() => ({
          supportsImages: false,
          supportsVideo: false,
          supportsFiles: false,
          supportsTools: false,
          supportsReasoning: false,
          provider: "",
        })}
        onAddModel={vi.fn()}
        onRemoveModel={vi.fn()}
        onToggleExpand={vi.fn()}
        onProviderChange={vi.fn()}
        onModelChange={vi.fn()}
        onGenerationOptionChange={vi.fn()}
        onReasoningChange={vi.fn()}
        onToolsJsonChange={vi.fn()}
        onProviderOptionsJsonChange={vi.fn()}
        onRequestAttachments={vi.fn()}
        onClearAttachments={vi.fn()}
        addDisabled
      />,
    );

    expect(screen.getByRole("button", { name: "Multi model" })).toBeDisabled();
  });
});

describe.skip("useModelSetupsState", () => {
  it("initialises and updates configuration state", () => {
    const models: AvailableModel[] = [
      {
        id: "gpt-4",
        name: "GPT-4",
        specification: { provider: "openai" },
      },
      {
        id: "claude-3",
        name: "Claude 3",
        specification: { provider: "anthropic" },
      },
    ] as any;

    const providerOptions = [
      { id: "openai", label: "OpenAI" },
      { id: "anthropic", label: "Anthropic" },
    ];

    const grouped = {
      openai: [{ id: "gpt-4", label: "GPT-4" }],
      anthropic: [{ id: "claude-3", label: "Claude 3" }],
    };

    const { result } = renderHook(() =>
      useModelSetupsState({
        models,
        providerOptions,
        groupedModelsByProvider: grouped,
        normaliseProviderId: (value) =>
          typeof value === "string" ? value.toLowerCase() : "",
      }),
    );

    act(() => {
      result.current.addConfig("gpt-4");
    });

    expect(result.current.configs).toHaveLength(1);
    const configKey = result.current.configs[0]!.key;
    expect(result.current.expandedKey).toBe(configKey);
    expect(result.current.configs[0]!.providerId).toBe("openai");
    expect(result.current.configs[0]!.modelId).toBe("gpt-4");

    act(() => {
      result.current.handleProviderChange(configKey, "anthropic");
    });

    expect(result.current.configs[0]!.providerId).toBe("anthropic");
    expect(result.current.configs[0]!.modelId).toBe("claude-3");

    act(() => {
      result.current.updateGenerationOption(configKey, "temperature", 0.5);
    });

    expect(result.current.configs[0]!.generationOptions.temperature).toBe(0.5);

    act(() => {
      result.current.removeConfig(configKey);
    });

    // Guard prevents removing the final configuration.
    expect(result.current.configs).toHaveLength(1);
  });
});
