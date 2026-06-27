import { z } from "zod";

export const outlineSchema = z.object({
  core_thesis: z
    .string()
    .describe("The primary argument or central lesson the post will deliver to the audience."),
  target_audience_takeaway: z
    .string()
    .describe("The actionable insight or value the reader will walk away with."),
  narrative_arc: z
    .array(z.string())
    .describe("An array of 3 to 4 chronological steps detailing how the content will flow (e.g., '1. Identify the mistake -> 2. Explain why it fails -> 3. Provide framework to fix it')."),
  suggested_examples: z
    .array(z.string())
    .describe("Ideas for real-world scenarios, case studies, metrics, or personal experiences that should be highlighted to support the lesson."),
  target_lsi_keywords: z
    .array(z.string())
    .describe("4 to 6 LSI SEO keywords that will be naturalized into the final post."),
});

export type PostOutline = z.infer<typeof outlineSchema>;
