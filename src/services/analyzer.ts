import { z } from "zod";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser, JsonOutputParser } from "@langchain/core/output_parsers";
import { writingDnaSchema, WritingDna } from "../schema/writingDnaSchema";
import { topicSchema, GeneratedTopics } from "../schema/topicSchema";
import { analyzeSystemPrompt } from "../prompts/analyze";
import { topicsSystemPrompt } from "../prompts/topics";
import {
	generatePostSystemPrompt,
	reviewPostSystemPrompt,
} from "../prompts/generatePost";
import { outlineSchema, PostOutline } from "../schema/outlineSchema";
import { outlineSystemPrompt } from "../prompts/outline";
import { getLLM, LLMProvider } from "../utils/llm";
import { getSearchTool } from "../utils/searchTool";
import { reviewPostSchema } from "../schema/reviewPromptSchema";
/**
 * Analyze an array of LinkedIn posts and return a Writing DNA profile.
 */
export async function analyzePosts(posts: string[], provider: LLMProvider = 'ollama'): Promise<WritingDna> {
	const llm = getLLM(provider);

	const prompt = ChatPromptTemplate.fromMessages([
		["system", analyzeSystemPrompt],
		["user", "Here are the user's LinkedIn posts:\n\n{posts}"],
	]);
	const formattedPosts = posts
		.map((post, i) => `--- Post ${i + 1} ---\n${post}`)
		.join("\n\n");

	const chain = provider === 'ollama'
		? prompt.pipe(llm).pipe(new JsonOutputParser())
		: prompt.pipe(llm.withStructuredOutput(writingDnaSchema));

	const response = await chain.invoke({ posts: formattedPosts });
	return response as WritingDna;
}

/**
 * Generate trending topic ideas based on a DNA profile.
 */
export async function generateTopics(
	dnaProfile: WritingDna,
    provider: LLMProvider = 'ollama'
): Promise<GeneratedTopics> {
	const llm = getLLM(provider);
	const searchTool = getSearchTool();

	// Prepare user topics for trend lookup
	const userTopics = Array.isArray(dnaProfile.topic.value)
		? dnaProfile.topic.value.join(", ")
		: String(dnaProfile.topic.value ?? "");

	let trendData = "";
	try {
		if (searchTool) {
			const searchResponse = await searchTool.search(
				`latest trending topics on LinkedIn regarding ${userTopics}`,
				{
					searchDepth: "basic",
					maxResults: 5,
				},
			);
			trendData = JSON.stringify(
				searchResponse.results.map((r) => ({
					title: r.title,
					content: r.content,
				})),
			);
			console.log({ trendData: JSON.parse(trendData) });
		} else {
			throw new Error("Tavily SDK not initialized");
		}
	} catch (error) {
		console.warn(
			"Tavily search failed or API key missing, proceeding with LLM baseline knowledge.",
			error,
		);
		trendData =
			"No live trend data available. Use internal knowledge of recent professional trends.";
	}

	const prompt = ChatPromptTemplate.fromMessages([
		["system", topicsSystemPrompt],
		[
			"user",
			`User's previous post topics:\n{userTopics}\n\nRecent Search Trends:\n{trendData}`,
		],
	]);

	const chain = provider === 'ollama'
		? prompt.pipe(llm).pipe(new JsonOutputParser())
		: prompt.pipe(llm.withStructuredOutput(topicSchema));

	const response = await chain.invoke({
		userTopics,
		trendData,
	});

	return response as GeneratedTopics;
}

/**
 * Generate a content outline based on selected topic (WITHOUT user DNA).
 */
export async function generateOutline(topicData: {
	title: string;
	reasoning: string;
}, provider: LLMProvider = 'ollama'): Promise<PostOutline> {
	const llm = getLLM(provider);
	const prompt = ChatPromptTemplate.fromMessages([
		["system", outlineSystemPrompt],
		[
			"user",
			"Topic Title: {topicTitle}\nTopic Reasoning: {topicReasoning}",
		],
	]);

	const chain = provider === 'ollama'
		? prompt.pipe(llm).pipe(new JsonOutputParser())
		: prompt.pipe(llm.withStructuredOutput(outlineSchema));

	const response = await chain.invoke({
		topicTitle: topicData.title,
		topicReasoning:
			topicData.reasoning || "Write a compelling post on this topic.",
	});

	return response as PostOutline;
}

/**
 * Generate a LinkedIn post for a given topic, outline, and steering feedback.
 */
export async function generatePost(
	dnaProfile: WritingDna,
	topicData: { title: string; reasoning: string },
	outline?: PostOutline,
	feedback?: string,
    provider: LLMProvider = 'ollama'
): Promise<string> {
	const llm = getLLM(provider);
	const prompt = ChatPromptTemplate.fromMessages([
		["system", generatePostSystemPrompt],
		[
			"user",
			`User's Writing DNA Profile:\n{dnaProfile}\n\nSelected Topic: {topicTitle}\nTopic Reasoning/Description: {topicReasoning}\n\nApproved Content Outline:\n{outlineData}\n\nUser Steering Feedback:\n{userFeedback}`,
		],
	]);

	const chain = prompt.pipe(llm).pipe(new StringOutputParser());

	const reviewPrompt = ChatPromptTemplate.fromMessages([
		["system", reviewPostSystemPrompt],
		["user", "Here is the post to review:\n\n{postContent}"],
	]);

	const reviewChain = provider === 'ollama'
		? reviewPrompt.pipe(llm).pipe(new JsonOutputParser())
		: reviewPrompt.pipe(llm.withStructuredOutput(reviewPostSchema));

	function extractValues(dna_profile: WritingDna) {
		return Object.entries(dna_profile).reduce((result: any, [key, obj]) => {
			if (key !== "topic" && obj && typeof obj === "object" && "value" in obj) {
				result[key] = obj.value;
			}
			return result;
		}, {});
	}

	let postContent = "";
	let currentFeedback = feedback || "None provided.";
	let attempts = 0;
	const maxAttempts = 3;
	// Feedback Loop to get post with score >= 25
	while (attempts < maxAttempts) {
		postContent = await chain.invoke({
			dnaProfile: JSON.stringify(dnaProfile, null, 2),
			topicTitle: topicData.title,
			topicReasoning:
				topicData.reasoning || "Write a compelling post on this topic.",
			outlineData: outline
				? JSON.stringify(outline, null, 2)
				: "No outline provided, generate based on topic reasoning.",
			userFeedback: currentFeedback,
		});

		const review = (await reviewChain.invoke({
			postContent,
			dnaProfile: JSON.stringify(extractValues(dnaProfile), null, 2),
		})) as z.infer<typeof reviewPostSchema>;

		console.log(
			`Attempt ${attempts + 1} - Review Score: ${review.total_score}`,
			{ review },
		);

		if (review.total_score >= 25 || attempts === maxAttempts - 1) {
			break;
		}

		const formattedRecommendations = review.recommendations
			.map((rec: any) => `- [${rec.title}]: ${rec.description}`)
			.join("\n");

		currentFeedback = `Please improve the post based on the following recommendations:\n${formattedRecommendations}\n\nOriginal user steering feedback: ${feedback || "None"}`;
		attempts++;
	}

	return postContent;
}
