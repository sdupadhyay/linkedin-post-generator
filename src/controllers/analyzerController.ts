import { Request, Response } from "express";
import {
	analyzePosts,
	generateTopics,
	generateOutline,
	generatePost,
} from "../services/analyzer";
import { DEFAULT_PROVIDER } from "../utils/llm";
import { createAuthClient } from "../utils/supabaseClient";

export const handleAnalyze = async (
	req: Request,
	res: Response,
): Promise<any> => {
	try {
		const { posts, provider = DEFAULT_PROVIDER, model } = req.body;

		if (!posts || !Array.isArray(posts) || posts.length === 0) {
			return res
				.status(400)
				.json({ error: "Please provide an array of posts." });
		}

		if (provider === "groq" && !process.env.GROQ_API_KEY) {
			return res
				.status(500)
				.json({ error: "GROQ_API_KEY is not configured on the server." });
		}

		// 1. Save Posts to Database First
		// We do this before calling the LLM so that if the LLM fails or times out,
		// the user doesn't lose the posts they just pasted in.
		if (req.user && req.token) {
			const userClient = createAuthClient(req.token);
			const postsToInsert = posts.map((content: string) => ({ user_id: req.user!.id, content }));
			const { error: postsError } = await userClient.from("user_posts").insert(postsToInsert);
			if (postsError) {
				console.error("Failed to save onboarding posts:", postsError);
			}
		}

		// 2. Run Heavy AI Analysis
		const dnaProfile = await analyzePosts(
			posts,
			provider as "groq" | "ollama",
			model,
			req.token,
			req.user?.id
		);

		// 3. Save resulting DNA Profile
		if (req.user && req.token) {
			const userClient = createAuthClient(req.token);
			const { error } = await userClient.from("user_dna").upsert(
				{
					user_id: req.user.id,
					dna_profile: dnaProfile,
					updated_at: new Date().toISOString(),
				},
				{ onConflict: "user_id" },
			);

			if (error) {
				console.error("Failed to save DNA to database:", error);
			}
		}

		return res.json(dnaProfile);
	} catch (error: any) {
		console.error("Error analyzing posts:", error);
		return res
			.status(500)
			.json({ error: "Failed to analyze posts", details: error.message });
	}
};

export const handleRegenerateDNA = async (req: Request, res: Response): Promise<any> => {
    try {
        const { provider = DEFAULT_PROVIDER, model } = req.body;
        
        if (provider === "groq" && !process.env.GROQ_API_KEY) {
			return res.status(500).json({ error: "GROQ_API_KEY is not configured on the server." });
		}

        if (!req.token || !req.user?.id) return res.status(401).json({ error: "Unauthorized" });
        const userClient = createAuthClient(req.token);
        
        // Fetch posts
        const { data: posts, error } = await userClient.from("user_posts").select("content");
        if (error || !posts || posts.length === 0) {
            return res.status(400).json({ error: "No saved posts found to analyze. Please add some posts first." });
        }
        
        const postContents = posts.map(p => p.content);
        
        const dnaProfile = await analyzePosts(
            postContents, 
            provider as "groq" | "ollama", 
            model, 
            req.token, 
            req.user.id
        );
        
        // Save to Database
        await userClient.from("user_dna").upsert({
            user_id: req.user.id,
            dna_profile: dnaProfile,
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_id" });
        
        return res.json(dnaProfile);
    } catch (error: any) {
        console.error("Error regenerating DNA:", error);
		return res.status(500).json({ error: "Failed to regenerate DNA", details: error.message });
    }
};

export const handleTopics = async (
	req: Request,
	res: Response,
): Promise<any> => {
	try {
		const { dnaProfile, provider = DEFAULT_PROVIDER, model } = req.body;

		if (!dnaProfile) {
			return res.status(400).json({ error: "Please provide a dnaProfile." });
		}

		if (provider === "groq" && !process.env.GROQ_API_KEY) {
			return res
				.status(500)
				.json({ error: "GROQ_API_KEY is not configured on the server." });
		}

		// Check if TAVILY_API_KEY exists, if not it will fallback in the analyzer
		if (!process.env.TAVILY_API_KEY) {
			console.warn(
				"TAVILY_API_KEY is missing, trend analysis will rely on base LLM knowledge.",
			);
		}

		const topics = await generateTopics(
			dnaProfile,
			provider as "groq" | "ollama",
			model,
			req.token,
			req.user?.id
		);
		return res.json(topics);
	} catch (error: any) {
		console.error("Error generating topics:", error);
		return res
			.status(500)
			.json({ error: "Failed to generate topics", details: error.message });
	}
};

export const handleGenerateOutline = async (
	req: Request,
	res: Response,
): Promise<any> => {
	try {
		const { topic, provider = DEFAULT_PROVIDER, model } = req.body;

		if (!topic || !topic.title) {
			return res
				.status(400)
				.json({ error: "Please provide a topic with a title." });
		}

		if (provider === "groq" && !process.env.GROQ_API_KEY) {
			return res
				.status(500)
				.json({ error: "GROQ_API_KEY is not configured on the server." });
		}

		const outline = await generateOutline(
			topic,
			provider as "groq" | "ollama",
			model,
			req.token,
			req.user?.id
		);
		return res.json(outline);
	} catch (error: any) {
		console.error("Error generating outline:", error);
		return res
			.status(500)
			.json({ error: "Failed to generate outline", details: error.message });
	}
};

export const handleGeneratePost = async (
	req: Request,
	res: Response,
): Promise<any> => {
	try {
		const {
			dnaProfile,
			topic,
			outline,
			feedback,
			provider = DEFAULT_PROVIDER,
			model
		} = req.body;

		if (!dnaProfile || !topic || !topic.title) {
			return res
				.status(400)
				.json({ error: "Please provide dnaProfile and topic with a title." });
		}

		if (provider === "groq" && !process.env.GROQ_API_KEY) {
			return res
				.status(500)
				.json({ error: "GROQ_API_KEY is not configured on the server." });
		}

		const postContent = await generatePost(
			dnaProfile,
			topic,
			outline,
			feedback,
			provider as "groq" | "ollama",
			model,
			req.token,
			req.user?.id
		);
		return res.json({ post: postContent });
	} catch (error: any) {
		console.error("Error generating post:", error);
		return res
			.status(500)
			.json({ error: "Failed to generate post", details: error.message });
	}
};
