import { z, defineCollection } from "astro:content";

const blog = defineCollection({
  schema: z.object({
    title: z.string(),
    summary: z.string(),
    publishedAt: z.date(),
  }),
});

export const collections = { blog };
