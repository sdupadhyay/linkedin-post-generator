import { Request, Response, NextFunction } from "express";
import { supabase } from "../supabase";

/**
 * Simple auth middleware that verifies a Supabase JWT supplied in the
 * `Authorization: Bearer <token>` header. On success the Supabase user object
 * is attached to `req.user` for downstream handlers.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Missing Authorization header" });
  }

  const token = authHeader.split(" ")[1];
  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      throw error ?? new Error("Invalid token");
    }
    // Attach the user to the request (type‑cast because Request has no user field)
    (req as any).user = data.user;
    next();
  } catch (e) {
    console.error("Auth error:", e);
    return res.status(401).json({ error: "Invalid or expired token" });
  }
}
