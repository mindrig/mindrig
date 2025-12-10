import { createGateway, GatewayProvider } from "@ai-sdk/gateway";
import type { LanguageModel } from "ai";
import { always } from "alwaysly";
import { nanoid } from "nanoid";
import { canonize } from "smolcanon";
import { log } from "smollog";
import { xxh32 } from "smolxxh";
import * as vscode from "vscode";

// NOTE: We start VS Code instance in pkgs/vsc-extension/tests/workspace/
// so we need to specify relative path to resolve pkgs/vsc-extension/dev/offline/gateway.json
const RECORDINGS_PATH = "../../dev/offline/gateway.json";

const STREAM_DELAY = 50;

export namespace GatewayOffline {
  export type RequestType =
    | "getAvailableModels"
    | "generateText"
    | "streamText";

  export type Recordings = Record<string, Recording>;

  export interface Recording {
    type: RequestType;
    model?: string;
    params?: any;
    response: any;
    timestamp: number;
  }

  export interface RecordingKey {
    type: RequestType;
    model?: string;
    params?: unknown;
  }

  export type LanguageModelV2 = Exclude<LanguageModel, string>;

  export type LanguageModelV2StreamPart =
    StreamResponse["stream"] extends ReadableStream<infer Part> ? Part : never;

  export type GenerateResponse = ReturnTypePromise<
    LanguageModelV2["doGenerate"]
  >;

  export type StreamResponse = ReturnTypePromise<LanguageModelV2["doStream"]>;

  type ReturnTypePromise<Type extends (...args: any) => any> =
    ReturnType<Type> extends PromiseLike<infer Result> ? Result : never;
}

export function createOfflineGateway(): GatewayProvider {
  const dummyGateway = createGateway({ apiKey: "dummy" });

  const provider: GatewayProvider = Object.assign(
    (modelId: string): LanguageModel => {
      const originalModel = dummyGateway(modelId);

      return {
        ...originalModel,
        specificationVersion: "v2",
        provider: "offline",
        modelId,

        async doGenerate(params) {
          const key = buildRecordingKey({
            type: "generateText",
            modelId,
            params,
          });
          const recording = await loadRecording(key);

          if (!recording) return createMockGenerateResponse(key);

          return recording.response;
        },

        async doStream(params) {
          const key = buildRecordingKey({
            type: "streamText",
            modelId: modelId,
            params,
          });
          const recording = await loadRecording(key);

          if (!recording) return createMockStreamResponse(key);

          const recordingResponse = recording.response;
          const stream = createOfflineStream(recordingResponse.parts || []);
          return {
            stream,
            request: Promise.resolve(recordingResponse.request || {}),
            response: Promise.resolve(recordingResponse.response || {}),
          };
        },
      } as LanguageModel;
    },
    {
      ...dummyGateway,

      async getAvailableModels() {
        const key = buildRecordingKey({ type: "getAvailableModels" });
        const recording = await loadRecording(key);

        if (!recording) return { models: [] };

        return recording.response;
      },
    },
  ) as GatewayProvider;

  return provider;
}

export function createRecordGateway(gateway: GatewayProvider): GatewayProvider {
  const provider: GatewayProvider = Object.assign(
    (modelId: string): LanguageModel => {
      const originalModel = gateway(modelId);

      return {
        ...originalModel,

        async doGenerate(params) {
          // Make request to the gateway
          const response = await originalModel.doGenerate(params);

          // Save response
          const key = buildRecordingKey({
            type: "generateText",
            modelId: modelId,
            params,
          });
          await saveRecording(key, {
            type: "generateText",
            model: modelId,
            params,
            response,
            timestamp: Date.now(),
          });

          return response;
        },

        async doStream(params) {
          const originalResponse = await originalModel.doStream(params);
          const originalStream = originalResponse.stream;

          const stream = new ReadableStream({
            async start(controller) {
              const parts: GatewayOffline.LanguageModelV2StreamPart[] = [];

              const reader = originalStream.getReader();
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                parts.push(value);
                controller.enqueue(value);
              }
              controller.close();

              // Wait for request/response
              const [request, response] = await Promise.all([
                originalResponse.request,
                originalResponse.response,
              ]);

              // Save recording
              const key = buildRecordingKey({
                type: "streamText",
                modelId: modelId,
                params: params,
              });
              await saveRecording(key, {
                type: "streamText",
                model: modelId,
                params: params,
                response: {
                  parts,
                  request,
                  response,
                },
                timestamp: Date.now(),
              });
            },
          });

          return {
            ...originalResponse,
            stream: stream,
          };
        },
      };
    },
    {
      ...gateway,

      async getAvailableModels() {
        const response = await gateway.getAvailableModels();

        const key = buildRecordingKey({ type: "getAvailableModels" });
        await saveRecording(key, {
          type: "getAvailableModels",
          response,
          timestamp: Date.now(),
        });
        return response;
      },
    },
  ) as GatewayProvider;

  return provider;
}

namespace buildRecordingKey {
  export interface Props {
    type: GatewayOffline.RequestType;
    modelId?: string;
    params?: unknown;
  }
}

function buildRecordingKey(props: buildRecordingKey.Props): string {
  const { type, modelId, params } = props;
  const parts: string[] = [type];

  if (modelId) parts.push(modelId);

  if (params) {
    const canon = canonize(params);
    const encoder = new TextEncoder();
    const data = encoder.encode(canon);
    const buffer = Buffer.from(data);
    const hash = xxh32(buffer).toString(16);
    parts.push(hash);
  }

  return parts.join(":");
}

async function loadRecording(
  key: string,
): Promise<GatewayOffline.Recording | null> {
  const recordings = await loadRecordings();
  return recordings?.[key] || null;
}

async function saveRecording(
  key: string,
  recording: GatewayOffline.Recording,
): Promise<void> {
  // Read recordings
  const recordings: GatewayOffline.Recordings = (await loadRecordings()) || {};

  // Add new recording
  recordings[key] = recording;

  // Write back
  const uri = buildRecordingsUri();
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(recordings, null, 2));
  await vscode.workspace.fs.writeFile(uri, data);
}

async function loadRecordings(): Promise<GatewayOffline.Recordings | null> {
  const uri = buildRecordingsUri();
  const data = await vscode.workspace.fs.readFile(uri);
  const decoder = new TextDecoder();

  try {
    const recordings: GatewayOffline.Recordings = JSON.parse(
      decoder.decode(data),
    );
    return recordings;
  } catch (err) {
    log.warn("Failed to load recordings at", uri.fsPath);
    return null;
  }
}

function buildRecordingsUri(): vscode.Uri {
  const workspaceFolder = vscode.workspace.workspaceFolders?.[0];
  always(workspaceFolder);
  return vscode.Uri.joinPath(workspaceFolder.uri, RECORDINGS_PATH);
}

function createMockGenerateResponse(
  key: string,
): GatewayOffline.GenerateResponse {
  const response: GatewayOffline.GenerateResponse = {
    content: [
      {
        type: "text",
        text: buildMockText(key),
      },
    ],
    finishReason: "stop",
    usage: {
      inputTokens: 0,
      outputTokens: 0,
      totalTokens: 0,
    },
    request: {
      body: JSON.stringify({ messages: [] }),
    },
    response: {
      headers: {},
    },
    warnings: [],
  };

  return response;
}

function createMockStreamResponse(key: string): GatewayOffline.StreamResponse {
  const stream = createOfflineStream(
    buildMockPartsFromChunks(buildMockChunks(key)),
  );

  const result: GatewayOffline.StreamResponse = {
    stream,
    ...buildMockResponseBase(),
  };

  return result;
}

function buildMockText(key: string): string {
  return buildMockChunks(key).join("");
}

function buildMockChunks(key: string): string[] {
  return [
    "⚠️ No offline recordings found ",
    `for the recording key: ${key}\n\n`,
    "You see a mock response as no ",
    "offline recording was found for ",
    "this request. To record the request ",
    "run the extension in the record mode.",
  ];
}

function createOfflineStream(
  parts: GatewayOffline.LanguageModelV2StreamPart[],
) {
  const stream = new ReadableStream({
    async start(controller) {
      for (const part of parts) {
        controller.enqueue(part);
        await new Promise((resolve) => setTimeout(resolve, STREAM_DELAY));
      }
      controller.close();
    },
  });

  return stream;
}

function buildMockResponseBase() {
  return {
    request: {
      body: JSON.stringify({ messages: [] }),
    },
    response: {
      headers: {},
    },
  };
}

function buildMockPartsFromChunks(
  chunks: string[],
): GatewayOffline.LanguageModelV2StreamPart[] {
  return [
    {
      type: "stream-start",
      warnings: [],
    },
    {
      id: nanoid(),
      type: "response-metadata",
    },
    ...chunks.map<GatewayOffline.LanguageModelV2StreamPart>((chunk) => ({
      id: nanoid(),
      type: "text-delta",
      delta: chunk,
    })),
    {
      id: nanoid(),
      type: "text-start",
    },
    {
      id: nanoid(),
      type: "text-end",
    },
    {
      type: "finish",
      finishReason: "stop",
      usage: {
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
      },
    },
  ];
}
