import { Request, Response } from "express";
import { supabase } from "../supabase";

/**
 * Retrieve the stored DNA JSON for the authenticated user.
 * Returns `{ dna: <object> }` on success, 404 if the user has no stored DNA.
 */
export async function getDnaHandler(req: Request, res: Response) {
  const user = (req as any).user; // set by middleware

  const { data, error } = await supabase
    .from("user_dna")
    .select("dna")
    .eq("id", user.id)
    .single();

  if (error) {
    // Supabase returns a PG error code for "row not found" – treat as 404.
    if ((error as any).code === "PGRST116") {
      return res.status(404).json({ error: "No DNA saved for this user" });
    }
    console.error("Supabase select error:", error);
    return res.status(500).json({ error: "Failed to retrieve DNA" });
  }

  return res.json({ dna: data.dna });
}
