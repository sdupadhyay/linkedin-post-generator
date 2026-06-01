import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { AnalyzerService } from "./services/analyzer";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../public")));

const analyzerService = new AnalyzerService();

app.post("/api/analyze", async (req: Request, res: Response): Promise<any> => {
	try {
		const { posts } = req.body;

		if (!posts || !Array.isArray(posts) || posts.length === 0) {
			return res
				.status(400)
				.json({ error: "Please provide an array of posts." });
		}

		if (!process.env.GROQ_API_KEY) {
			return res
				.status(500)
				.json({ error: "GROQ_API_KEY is not configured on the server." });
		}

		const dnaProfile = await analyzerService.analyzePosts(posts);
		let ans = res.json(dnaProfile);
		return res.json(dnaProfile);
	} catch (error: any) {
		console.error("Error analyzing posts:", error);
		return res
			.status(500)
			.json({ error: "Failed to analyze posts", details: error.message });
	}
});

app.post("/api/topics", async (req: Request, res: Response): Promise<any> => {
	try {
		const { dnaProfile } = req.body;

		if (!dnaProfile) {
			return res.status(400).json({ error: "Please provide a dnaProfile." });
		}

		if (!process.env.GROQ_API_KEY) {
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

		const topics = await analyzerService.generateTopics(dnaProfile);
		return res.json(topics);
	} catch (error: any) {
		console.error("Error generating topics:", error);
		return res
			.status(500)
			.json({ error: "Failed to generate topics", details: error.message });
	}
});

app.post('/api/generate', async (req: Request, res: Response): Promise<any> => {
  try {
    const { dnaProfile, topic } = req.body;

    if (!dnaProfile || !topic || !topic.title) {
      return res.status(400).json({ error: 'Please provide dnaProfile and topic with a title.' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    }

    const postContent = await analyzerService.generatePost(dnaProfile, topic);
    return res.json({ post: postContent });
  } catch (error: any) {
    console.error("Error generating post:", error);
    return res.status(500).json({ error: 'Failed to generate post', details: error.message });
  }
});

app.listen(port, () => {
	console.log(`Server is running at http://localhost:${port}`);
});
