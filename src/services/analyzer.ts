import { ChatGroq } from "@langchain/groq";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import { StringOutputParser } from "@langchain/core/output_parsers";
import { tavily } from "@tavily/core";
import { writingDnaSchema, WritingDna } from "../schema/writingDnaSchema";
import { topicSchema, GeneratedTopics } from "../schema/topicSchema";

export class AnalyzerService {
  private llm: ChatGroq;
  private searchTool: ReturnType<typeof tavily> | null;

  constructor() {
    this.llm = new ChatGroq({
      model: "llama-3.3-70b-versatile", // Versatile and fast for structured outputs
      temperature: 0,
      maxRetries: 2,
    });

    try {
      this.searchTool = tavily(); // Automatically uses TAVILY_API_KEY
    } catch (e) {
      this.searchTool = null;
    }
  }

  async analyzePosts(posts: string[]): Promise<WritingDna> {
    const structuredLlm = this.llm.withStructuredOutput(writingDnaSchema);

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an expert AI Writing Analyst. Your task is to analyze a user's LinkedIn posts and extract their Writing DNA Profile.
        
        Analyze the following aspects:
        1. Tone: The overall mood and voice (e.g., conversational, professional).
        2. avg_words: The average number of words per post.
        3. hoop_type: The hook type they use to start posts (e.g., question, statistic, story, statement). This is what the user alternates in the statement of the post.
        4. emoji_frequency: How often they use emojis (e.g., high, moderate, low, none).
        5. paragraph_size: The average size of their paragraphs.
        6. writing_type: The overall style of their writing (e.g., story-telling, analytical, listicle).
        7. topic: An array of the main topics they cover.

        Confidence Rules:
        For every single field, you must provide a "value", "confidence", and "reasoning".
        - 0.75 - 1.00 -> Hard rule (Very confident based on strong evidence in most posts).
        - 0.50 - 0.74 -> Soft guideline (Moderately confident, apparent in some posts).
        - Below 0.50 -> Weak signal (Not enough evidence, but providing a best guess).

        You must provide reasoning for every extracted field explaining how the value was derived from the provided posts.`
      ],
      [
        "user",
        "Here are the user's LinkedIn posts:\n\n{posts}"
      ]
    ]);

    const formattedPosts = posts.map((post, i) => `--- Post ${i + 1} ---\n${post}`).join("\n\n");

    const chain = prompt.pipe(structuredLlm);

    const response = await chain.invoke({
      posts: formattedPosts
    });

    return response;
  }

  async generateTopics(dnaProfile: WritingDna): Promise<GeneratedTopics> {
    // Safely extract main topics
    const userTopics = Array.isArray(dnaProfile.topic.value) 
        ? dnaProfile.topic.value.join(", ") 
        : String(dnaProfile.topic.value || "");
        
    let trendData = "";
    
    try {
        if (this.searchTool) {
            const searchResponse = await this.searchTool.search(`latest trending topics on LinkedIn regarding ${userTopics}`, {
                searchDepth: "basic",
                maxResults: 5
            });
            trendData = JSON.stringify(searchResponse.results.map(r => ({ title: r.title, content: r.content })));
        } else {
            throw new Error("Tavily SDK not initialized");
        }
    } catch (error) {
        console.warn("Tavily search failed or API key missing, proceeding with LLM baseline knowledge.", error);
        trendData = "No live trend data available. Use your internal knowledge of recent professional trends.";
    }

    const structuredLlm = this.llm.withStructuredOutput(topicSchema);

    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are a top-tier LinkedIn Content Strategist. Your goal is to generate exactly 5 to 10 highly engaging topic ideas for a user.
        
        You have two inputs:
        1. The user's "Writing DNA Profile", which dictates their tone, style, topics, and hooks.
        2. Recent trend data fetched from the web regarding their niche.

        Your output must be a structured list of topics. For each topic, provide:
        - topic_title: A catchy, relevant idea for a post.
        - confidence: A score from 0.0 to 1.0 on how well this topic perfectly aligns with BOTH their DNA profile and the recent trends. Calculate this strictly.
        - reasoning: Explain exactly why this topic was chosen.
        `
      ],
      [
        "user",
        `User's Writing DNA Profile:\n{dnaProfile}\n\nRecent Search Trends:\n{trendData}`
      ]
    ]);

    const chain = prompt.pipe(structuredLlm);

    const response = await chain.invoke({
        dnaProfile: JSON.stringify(dnaProfile, null, 2),
        trendData: trendData
    });

    return response;
  }

  async generatePost(dnaProfile: WritingDna, topicData: { title: string, reasoning: string }): Promise<string> {
    const prompt = ChatPromptTemplate.fromMessages([
      [
        "system",
        `You are an Senior content writer for linkedin post with 10+ Years of experience. Your job is to draft a viral, engaging LinkedIn post for the user.
        
        You must rigidly adhere to the user's "Writing DNA Profile":
        - Tone: Follow the extracted tone perfectly.
        - Hook Type (hoop_type): Start the post utilizing this exact hook strategy.
        - Paragraph Size: Format your sentences and line breaks to match their average paragraph size.
        - Emoji Frequency: Use emojis exactly as often as they do.
        - Writing Type: Maintain their overall writing style (e.g. story-telling, listicle).

        Additionally, you will be given a Topic and Reasoning.
        Write a high-quality post about this Topic, naturally integrating the concepts from the Reasoning.
        
        At the very end of the post, append 3 to 5 highly relevant and popular LinkedIn hashtags (e.g. #agenticai, #leadership, etc. depending on the content).

        Output ONLY the raw content of the LinkedIn post, nothing else. No preamble.`
      ],
      [
        "user",
        `User's Writing DNA Profile:\n{dnaProfile}\n\nSelected Topic: {topicTitle}\nTopic Reasoning/Description: {topicReasoning}`
      ]
    ]);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    const postContent = await chain.invoke({
        dnaProfile: JSON.stringify(dnaProfile, null, 2),
        topicTitle: topicData.title,
        topicReasoning: topicData.reasoning || "Write a compelling post on this topic."
    });

    return postContent;
  }
}
