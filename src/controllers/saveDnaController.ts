import { Request, Response } from "express";
import { supabase } from "../supabase";

/**
 * Persist the user's DNA JSON profile. The request must include a
 * `dnaProfile` field (any JSON‑serialisable object). The route is protected by
 * `requireAuth`, so `req.user.id` is guaranteed to be the Supabase user UUID.
 */
export async function saveDnaHandler(req: Request, res: Response) {
  const user = (req as any).user; // set by middleware
  const { dnaProfile } = req.body;

  if (!dnaProfile) {
    return res.status(400).json({ error: "Missing dnaProfile payload" });
  }

  // Upsert – insert a row if none exists, otherwise update the existing row.
  const { error } = await supabase
    .from("user_dna")
    .upsert({
      id: user.id,
      dna: dnaProfile,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    console.error("Supabase upsert error:", error);
    return res.status(500).json({ error: "Failed to store DNA" });
  }

  return res.json({ success: true });
}
