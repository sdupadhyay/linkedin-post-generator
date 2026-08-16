import { z } from "zod";

export const searchQueriesSchema = z.object({
  queries: z.array(z.string()).min(3).max(4).describe("An array of 3-4 web search queries.")
});

export type SearchQueries = z.infer<typeof searchQueriesSchema>;
