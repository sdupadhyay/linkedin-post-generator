import { z } from "zod";

const fieldSchema = <T extends z.ZodTypeAny>(valueType: T) => z.object({
  value: valueType,
  confidence: z.number().min(0).max(1).describe("Confidence score between 0.0 and 1.0. Hard rule: 0.75-1.0, Soft guideline: 0.5-0.74, Weak signal: <0.5"),
  reasoning: z.string().describe("Explanation of how the value was derived based on the posts.")
});

export const writingDnaSchema = z.object({
  tone: fieldSchema(z.string().describe("The tone of the writing, e.g., conversational, professional, aggressive, inspiring.")),
  avg_words: fieldSchema(z.number().describe("Average word count per post.")),
  hoop_type: fieldSchema(z.string().describe("The hook type used in the posts. e.g., question, statistic, story. It is what the user alternates in the statement of the post.")),
  emoji_frequency: fieldSchema(z.string().describe("Frequency or amount of emojis used. E.g., 'high', 'moderate', 'low', 'none', or a specific average number.")),
  paragraph_size: fieldSchema(z.string().describe("Average size of paragraphs. E.g., '1-2 sentences', 'short', 'long', 'mixed'.")),
  writing_type: fieldSchema(z.string().describe("The style or type of writing. E.g., story-telling, analytical, listicle, advice.")),
  topic: fieldSchema(z.array(z.string()).describe("List of main topics covered across the posts."))
});

export type WritingDna = z.infer<typeof writingDnaSchema>;
