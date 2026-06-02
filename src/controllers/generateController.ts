import { Request, Response } from "express";
import { generatePost } from "../services/analyzer";

/**
 * Handler for POST /api/generate – creates a LinkedIn post for a supplied topic.
 */
export async function generateHandler(req: Request, res: Response) {
  try {
    const { dnaProfile, topic } = req.body;
    if (!dnaProfile || !topic || !topic.title) {
      return res
        .status(400)
        .json({ error: "Please provide dnaProfile and topic with a title." });
    }

    const postContent = await generatePost(dnaProfile, topic);
    return res.json({ post: postContent });
  } catch (error: any) {
    console.error("Error generating post:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate post", details: error.message });
  }
}
