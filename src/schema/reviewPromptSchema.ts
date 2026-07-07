import { z } from "zod";
export const reviewPostSchema = z.object({
	total_score: z.number().min(0).max(30).describe("Total score out of 30"),
	recommendations: z
		.array(
			z.object({
				id: z.number().min(1).max(3).describe("Recommendation ID"),
				title: z.string().describe("Recommendation Title"),
				description: z.string().describe("Recommendation Description"),
			}),
		)
		.describe("List of recommendations to improve the post"),
});
