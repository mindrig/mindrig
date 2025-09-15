import { createGateway } from "@ai-sdk/gateway";
import { Hono } from "hono";
import { cors } from "hono/cors";

const app = new Hono<{ Bindings: Cloudflare.Env }>();

app.use("*", cors());

app.get("/vercel/models", async (c) => {
  const vercelKey = c.env.VERCEL_GATEWAY_KEY;
  if (!vercelKey) return c.text("Vercel Gateway is not configured!", 500);

  const gateway = createGateway({ apiKey: vercelKey });
  const resp = await gateway.getAvailableModels();
  return c.json(resp, 200);
});

export default app;
