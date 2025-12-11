import { createGateway } from "@ai-sdk/gateway";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { proxy } from "hono/proxy";

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

const DEMO_PROXY_PATH = "/demo/proxy";

app.all(`${DEMO_PROXY_PATH}/*`, (c) => {
  const proxiedPath = c.req.path.slice(DEMO_PROXY_PATH.length);
  return proxy(`${c.env.DEMO_GATEWAY_ORIGIN}${proxiedPath}`, c.req);
});

async function loadRecording(): Promise<any> {
  // @ts-expect-error - node:fs/promises is only available in wrangler dev
  const fs = await import("node:fs/promises");
  const data = await fs.readFile(RECORDING_PATH, "utf8");
  return JSON.parse(data);
}

async function saveRecording(response: any): Promise<void> {
  // @ts-expect-error - node:fs/promises is only available in wrangler dev
  const fs = await import("node:fs/promises");
  const content = JSON.stringify(response, null, 2);
  await fs.writeFile(RECORDING_PATH, content, "utf8");
}
