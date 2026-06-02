import { Request, Response } from "express";
import { generateTopics } from "../services/analyzer";

/**
 * Handler for POST /api/topics – produces a list of trending topic ideas based on a DNA profile.
 */
export async function topicsHandler(req: Request, res: Response) {
  try {
    const { dnaProfile } = req.body;
    if (!dnaProfile) {
      return res.status(400).json({ error: "Please provide dnaProfile." });
    }

    const topics = await generateTopics(dnaProfile);
    return res.json(topics);
  } catch (error: any) {
    console.error("Error generating topics:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate topics", details: error.message });
  }
}
