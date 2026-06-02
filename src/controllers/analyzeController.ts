import { Request, Response } from "express";
import { analyzePosts } from "../services/analyzer";

/**
 * Handler for POST /api/analyze – extracts a Writing DNA profile from an array of LinkedIn posts.
 */
export async function analyzeHandler(req: Request, res: Response) {
  try {
    const { posts } = req.body;
    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: "Please provide an array of posts." });
    }

    const dnaProfile = await analyzePosts(posts);
    return res.json(dnaProfile);
  } catch (error: any) {
    console.error("Error analyzing posts:", error);
    return res
      .status(500)
      .json({ error: "Failed to analyze posts", details: error.message });
  }
}
