import { Request, Response } from "express";
import { generatePost } from "../services/analyzer";
import { supabase } from "../supabase";

/**
 * Handler for POST /api/generate – creates a LinkedIn post for a supplied topic.
 *
 * If the client does not send a `dnaProfile` we attempt to pull the stored DNA
 * for the authenticated user (the route is protected by `requireAuth`).
 */
export async function generateHandler(req: Request, res: Response) {
  try {
    const { dnaProfile, topic } = req.body;

    // --- Resolve DNA profile -------------------------------------------------
    let dna = dnaProfile;
    if (!dna) {
      // The auth middleware attaches the user on the request object.
      const user = (req as any).user;
      if (!user?.id) {
        return res.status(401).json({ error: "Unauthenticated – missing user ID" });
      }
      const { data, error } = await supabase
        .from("user_dna")
        .select("dna")
        .eq("id", user.id)
        .single();
      if (error || !data?.dna) {
        return res
          .status(400)
          .json({ error: "DNA profile not supplied and none stored for this user." });
      }
      dna = data.dna;
    }

    // --- Validate topic ------------------------------------------------------
    if (!topic || !topic.title) {
      return res.status(400).json({ error: "Please provide a topic with a title." });
    }

    const postContent = await generatePost(dna, topic);
    return res.json({ post: postContent });
  } catch (error: any) {
    console.error("Error generating post:", error);
    return res
      .status(500)
      .json({ error: "Failed to generate post", details: error.message });
  }
}
