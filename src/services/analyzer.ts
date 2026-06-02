import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { tavily } from "@tavily/core";
import { writingDnaSchema, WritingDna } from "../schema/writingDnaSchema";
import { topicSchema, GeneratedTopics } from "../schema/topicSchema";
import { analyzeSystemPrompt } from "../prompts/analyze";
import { topicsSystemPrompt } from "../prompts/topics";
import { generatePostSystemPrompt } from "../prompts/generatePost";
import { getLLM } from "../utils/llm";
import { getSearchTool } from "../utils/searchTool";


/**
 * Analyze an array of LinkedIn posts and return a Writing DNA profile.
 */
export async function analyzePosts(posts: string[]): Promise<WritingDna> {
  const llm = getLLM();
  const structuredLlm = llm.withStructuredOutput(writingDnaSchema);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", analyzeSystemPrompt],
    ["user", "Here are the user's LinkedIn posts:\n\n{posts}"],
  ]);

  const formattedPosts = posts
    .map((post, i) => `--- Post ${i + 1} ---\n${post}`)
    .join("\n\n");

  const chain = prompt.pipe(structuredLlm);

  const response = await chain.invoke({ posts: formattedPosts });
  return response;
}

/**
 * Generate trending topic ideas based on a DNA profile.
 */
export async function generateTopics(dnaProfile: WritingDna): Promise<GeneratedTopics> {
  const llm = getLLM();
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
        }
      );
      trendData = JSON.stringify(
        searchResponse.results.map((r) => ({ title: r.title, content: r.content }))
      );
    } else {
      throw new Error("Tavily SDK not initialized");
    }
  } catch (error) {
    console.warn(
      "Tavily search failed or API key missing, proceeding with LLM baseline knowledge.",
      error
    );
    trendData = "No live trend data available. Use internal knowledge of recent professional trends.";
  }

  const structuredLlm = llm.withStructuredOutput(topicSchema);

  const prompt = ChatPromptTemplate.fromMessages([
    ["system", topicsSystemPrompt],
    [
      "user",
      `User's Writing DNA Profile:\n{dnaProfile}\n\nRecent Search Trends:\n{trendData}`,
    ],
  ]);

  const chain = prompt.pipe(structuredLlm);
  const response = await chain.invoke({
    dnaProfile: JSON.stringify(dnaProfile, null, 2),
    trendData,
  });

  return response;
}

/**
 * Generate a LinkedIn post for a given topic.
 */
export async function generatePost(
  dnaProfile: WritingDna,
  topicData: { title: string; reasoning: string }
): Promise<string> {
  const llm = getLLM();
  const prompt = ChatPromptTemplate.fromMessages([
    ["system", generatePostSystemPrompt],
    [
      "user",
      `User's Writing DNA Profile:\n{dnaProfile}\n\nSelected Topic: {topicTitle}\nTopic Reasoning/Description: {topicReasoning}`,
    ],
  ]);

  const chain = prompt.pipe(llm).pipe(new StringOutputParser());

  const postContent = await chain.invoke({
    dnaProfile: JSON.stringify(dnaProfile, null, 2),
    topicTitle: topicData.title,
    topicReasoning: topicData.reasoning || "Write a compelling post on this topic.",
  });

  return postContent;
}
