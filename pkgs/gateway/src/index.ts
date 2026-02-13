import { createGateway } from "@ai-sdk/gateway";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { proxy } from "hono/proxy";
import OpenAI from "openai";

// Toggle to use the default gateway for the demo instead of proxying to
// a running LM Studio server instance (or compatible).
const USE_GATEWAY_FOR_DEMO = true;

const app = new Hono<{ Bindings: Cloudflare.Env }>();
export default app;

app.use("*", cors());

const RECORDING_PATH = "dev/offline/gateway.json";

app.get("/vercel/models", async (c) => {
  const vercelKey = c.env.VERCEL_GATEWAY_KEY;
  const offline = c.env.MINDRIG_DEV_OFFLINE === "true";
  const record = c.env.MINDRIG_DEV_RECORD === "true";

  if (offline) {
    const recording = await loadRecording();
    return c.json(recording || { models: [] });
  }

  if (!vercelKey) return c.text("Vercel Gateway is not configured!", 500);

  const gateway = createGateway({ apiKey: vercelKey });
  const response = await gateway.getAvailableModels();

  if (record) await saveRecording(response);

  return c.json(response);
});

const LM_STUDIO_TO_GATEWAY_MAP = {
  "mistralai/ministral-3-3b": "openai/gpt-5-nano",
} as const;

namespace LmStudio {
  export type Model = keyof typeof LM_STUDIO_TO_GATEWAY_MAP;

  export interface RequestBody {
    model: Model;
    messages: Message[];
    stream: boolean;
  }

  export interface Message {
    role: string;
    content: string;
  }
}

if (USE_GATEWAY_FOR_DEMO) {
  app.post("/demo/proxy/v1/chat/completions", async (c) => {
    const vercelKey = c.env.VERCEL_GATEWAY_KEY;

    if (!vercelKey)
      return c.json({ message: "Vercel Gateway is not configured!" }, 500);

    const openai = new OpenAI({
      apiKey: vercelKey,
      baseURL: "https://ai-gateway.vercel.sh/v1",
    });

    const body = await c.req.json();
    const model =
      body.model in LM_STUDIO_TO_GATEWAY_MAP
        ? LM_STUDIO_TO_GATEWAY_MAP[body.model as LmStudio.Model]
        : body.model;

    try {
      if (body.stream) {
        const gatewayStream = await openai.chat.completions
          .create({
            model,
            messages: body.messages,
            stream: true,
          })
          .withResponse();
        return gatewayStream.response;
      }

      const response = await openai.chat.completions.create({
        model,
        messages: body.messages,
      });
      return c.json(response);
    } catch (error) {
      console.error("Error proxying request to Vercel Gateway:", error);
      return c.json(
        { message: "Error sending request to Vercel Gateway" },
        500,
      );
    }
  });
} else {
  const DEMO_PROXY_PATH = "/demo/proxy";

  app.all(`${DEMO_PROXY_PATH}/*`, (c) => {
    const proxiedPath = c.req.path.slice(DEMO_PROXY_PATH.length);
    return proxy(`${c.env.DEMO_GATEWAY_ORIGIN}${proxiedPath}`, c.req);
  });
}

async function loadRecording(): Promise<any> {
  const fs = await import("node:fs/promises");
  const data = await fs.readFile(RECORDING_PATH, "utf8");
  return JSON.parse(data);
}

async function saveRecording(response: any): Promise<void> {
  const fs = await import("node:fs/promises");
  const content = JSON.stringify(response, null, 2);
  await fs.writeFile(RECORDING_PATH, content, "utf8");
}
