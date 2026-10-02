import { z } from "zod";

export const topicSchema = z.object({
  topics: z.array(
    z.object({
      topic_title: z.string().describe("The suggested title or main idea of the LinkedIn post."),
      audience_fit: z.number().min(0).max(1).describe("How precisely this matches the Target Audience's actual level/context, based on their previous post topics"),
      trend_relevance: z.number().min(0).max(1).describe("How directly this topic addresses a real, current problem surfaced in the search trends"),
      source_trend: z.string().describe("A short quote or paraphrase of the specific trend data point that inspired this topic."),
      reasoning: z.string().describe("Explanation of why this topic was chosen, bridging the gap between the user's DNA and the recent search trends.")
    })
  ).min(5).max(10).describe("A list of 5 to 10 trending topics.")
});

export type GeneratedTopics = z.infer<typeof topicSchema>;
