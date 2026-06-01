import { z } from "zod";

export const topicSchema = z.object({
  topics: z.array(
    z.object({
      topic_title: z.string().describe("The suggested title or main idea of the LinkedIn post."),
      confidence: z.number().min(0).max(1).describe("Confidence score between 0.0 and 1.0 on how well this topic matches the user's Writing DNA and current LinkedIn trends. 0.75-1.00 is a very strong match, 0.50-0.74 is a moderate match, <0.50 is weak."),
      reasoning: z.string().describe("Explanation of why this topic was chosen, bridging the gap between the user's DNA and the recent search trends.")
    })
  ).min(5).max(10).describe("A list of 5 to 10 trending topics.")
});

export type GeneratedTopics = z.infer<typeof topicSchema>;
