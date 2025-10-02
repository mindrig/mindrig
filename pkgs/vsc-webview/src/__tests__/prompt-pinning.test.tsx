import { Index } from "@/app/Index";
import { SettingsContext } from "@/aspects/settings/Context";
import { MessageProvider } from "@/aspects/message/messageContext";
import { VscContext } from "@/aspects/vsc/Context";
import { Prompt } from "@mindrig/types";
import { act, cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SyncFile } from "@wrkspc/vsc-sync";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

vi.mock("katex/dist/katex.min.css", () => ({}));

vi.mock("@/aspects/models-dev/Context", () => {
  const fallbackData: Record<string, any> = {
    openai: {
      id: "openai",
      name: "OpenAI",
      models: {
        "gpt-5": { name: "GPT-5", last_updated: "2025-01-01T00:00:00Z" },
        "gpt-5-mini": {
          name: "GPT-5 Mini",
          last_updated: "2025-01-01T00:00:00Z",
        },
      },
    },
  };

  const providers: Record<string, any> = {
    openai: {
      id: "openai",
      name: "OpenAI",
      models: fallbackData.openai.models,
    },
  };

  const modelsByProvider: Record<string, Record<string, any>> = {
    openai: {
      "gpt-5": { id: "gpt-5", name: "GPT-5" },
      "gpt-5-mini": { id: "gpt-5-mini", name: "GPT-5 Mini" },
    },
  };

  const normalise = (value: string | null | undefined) =>
    (value ?? "").toLowerCase();

  const stub = {
    data: fallbackData,
    providers,
    modelsByProvider,
    getProvider: (providerId: string | null | undefined) =>
      providers[normalise(providerId)],
    getModel: (
      providerId: string | null | undefined,
      modelId: string | null | undefined,
    ) => {
      const providerKey = normalise(providerId);
      const modelKey = normalise(modelId);
      return modelsByProvider[providerKey]?.[modelKey];
    },
    getCapabilities: () => ({
      supportsImages: false,
      supportsVideo: false,
      supportsFiles: false,
      supportsTools: false,
      supportsReasoning: false,
      provider: "openai",
    }),
    isLoading: false,
    isValidating: false,
    isFallback: true,
    error: null,
    mutate: vi.fn(),
  } as const;

  return {
    useModelsDev: () => stub,
  };
});

type WebviewState = {
  pinnedPrompt: null | {
    prompt: Prompt;
    promptIndex: number | null;
    file: SyncFile.State | null;
    filePath: string | null;
  };
};

describe("prompt pinning", () => {
  let persistedState: WebviewState;
  let postMessage: ReturnType<typeof vi.fn>;
  let getState: ReturnType<typeof vi.fn>;
  let setState: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    persistedState = { pinnedPrompt: null };
    postMessage = vi.fn();
    getState = vi.fn(() => persistedState);
    setState = vi.fn((state: WebviewState) => {
      persistedState = state;
    });
  });

  afterEach(() => {
    cleanup();
    vi.restoreAllMocks();
  });

  test("shows prompt source when pinned despite settings", async () => {
    const { pinButton } = await renderIndex({
      settings: { playground: { showSource: false } },
    });

    dispatchActiveFileChanged(sampleFileState);
    dispatchPromptsChanged(samplePrompts);

    await waitFor(() =>
      expect(
        screen.getByRole("button", { name: /(un)?pin prompt/i }),
      ).toBeEnabled(),
    );
    expect(screen.queryByRole("textbox", { name: /prompt/i })).toBeNull();

    await userEvent.click(pinButton());

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /prompt/i })).toHaveValue(
        FIRST_PROMPT_SOURCE,
      ),
    );
  });

  test("re-hydrates pinned prompt from persisted state", async () => {
    const { pinButton } = await renderIndex({
      settings: { playground: { showSource: false } },
    });

    dispatchActiveFileChanged(sampleFileState);
    dispatchPromptsChanged(samplePrompts);
    await waitFor(() => expect(pinButton()).toBeEnabled());

    await userEvent.click(pinButton());
    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /prompt/i })).toHaveValue(
        FIRST_PROMPT_SOURCE,
      ),
    );

    cleanup();

    const rerenderResult = await renderIndex({
      settings: { playground: { showSource: false } },
      reuseState: true,
    });

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /prompt/i })).toHaveValue(
        FIRST_PROMPT_SOURCE,
      ),
    );

    expect(rerenderResult.pinButton()).toHaveAttribute("aria-pressed", "true");
  });

  test("selecting a new prompt while pinned updates the prompt source", async () => {
    const { pinButton, selectPrompt } = await renderIndex({
      settings: { playground: { showSource: false } },
    });

    dispatchActiveFileChanged(sampleFileState);
    dispatchPromptsChanged(samplePrompts);

    await waitFor(() => expect(pinButton()).toBeEnabled());
    await userEvent.click(pinButton());

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /prompt/i })).toHaveValue(
        FIRST_PROMPT_SOURCE,
      ),
    );

    await selectPrompt("Second prompt");

    await waitFor(() =>
      expect(screen.getByRole("textbox", { name: /prompt/i })).toHaveValue(
        SECOND_PROMPT_SOURCE,
      ),
    );

    expect(persistedState.pinnedPrompt?.promptIndex).toBe(1);
  });

  async function renderIndex(options: { settings: any; reuseState?: boolean }) {
    if (!options.reuseState) {
      persistedState = { pinnedPrompt: null };
    }

    const vsc = { postMessage, getState, setState };

    render(
      <VscContext.Provider value={{ vsc }}>
        <MessageProvider>
          <SettingsContext.Provider value={{ settings: options.settings }}>
            <Index />
          </SettingsContext.Provider>
        </MessageProvider>
      </VscContext.Provider>,
    );

    await waitFor(() => {
      expect(postMessage).toHaveBeenCalledWith({
        type: "lifecycle-webview-ready",
      });
    });

    const pinButton = () =>
      screen.getByRole("button", { name: /(un)?pin prompt/i });

    const selectPrompt = async (label: string) => {
      const trigger = screen.getByLabelText("Select prompt");
      await userEvent.click(trigger);
      const option = await screen.findByRole("option", { name: label });
      await userEvent.click(option);
    };

    return { pinButton, selectPrompt };
  }

  function dispatchActiveFileChanged(file: SyncFile.State) {
    act(() => {
      window.postMessage({ type: "file-active-change", payload: file }, "*");
    });
  }

  function dispatchPromptsChanged(prompts: Prompt[]) {
    act(() => {
      window.postMessage({ type: "prompts-change", payload: { prompts } }, "*");
    });
  }

  const FIRST_PROMPT_SOURCE = "// Prompt: first";
  const SECOND_PROMPT_SOURCE = "// Prompt: second";

  const sampleFileState: SyncFile.State = {
    path: "/workspace/src/example.ts",
    content: `${FIRST_PROMPT_SOURCE}\n${SECOND_PROMPT_SOURCE}\n`,
    isDirty: false,
    lastSaved: new Date(),
    languageId: "ts",
    cursor: { offset: 5, line: 0, character: 5 },
  };

  const samplePrompts: Prompt[] = [
    {
      file: sampleFileState.path,
      exp: "First prompt",
      span: {
        inner: { start: 0, end: FIRST_PROMPT_SOURCE.length },
        outer: { start: 0, end: FIRST_PROMPT_SOURCE.length },
      },
      vars: [],
    },
    {
      file: sampleFileState.path,
      exp: "Second prompt",
      span: {
        inner: {
          start: FIRST_PROMPT_SOURCE.length + 1,
          end: FIRST_PROMPT_SOURCE.length + 1 + SECOND_PROMPT_SOURCE.length,
        },
        outer: {
          start: FIRST_PROMPT_SOURCE.length + 1,
          end: FIRST_PROMPT_SOURCE.length + 1 + SECOND_PROMPT_SOURCE.length,
        },
      },
      vars: [],
    },
  ];
});
