import { Request, Response } from "express";
import { createAuthClient } from "../utils/supabaseClient";

export const getPosts = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.token) return res.status(401).json({ error: "Unauthorized" });

        const supabase = createAuthClient(req.token);
        const { data, error } = await supabase
            .from("user_posts")
            .select("*")
            .order("created_at", { ascending: false });

        if (error) throw error;

        return res.json({ posts: data });
    } catch (error: any) {
        console.error("Error fetching posts:", error);
        return res.status(500).json({ error: "Failed to fetch posts", details: error.message });
    }
};

export const addPost = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.token || !req.user?.id) return res.status(401).json({ error: "Unauthorized" });

        const { content } = req.body;
        if (!content || typeof content !== "string") {
            return res.status(400).json({ error: "Post content is required" });
        }

        const supabase = createAuthClient(req.token);
        const { data, error } = await supabase
            .from("user_posts")
            .insert([{ user_id: req.user.id, content }])
            .select()
            .single();

        if (error) throw error;

        return res.status(201).json({ post: data });
    } catch (error: any) {
        console.error("Error adding post:", error);
        return res.status(500).json({ error: "Failed to add post", details: error.message });
    }
};

export const deletePost = async (req: Request, res: Response): Promise<any> => {
    try {
        if (!req.token) return res.status(401).json({ error: "Unauthorized" });

        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ error: "Post ID is required" });
        }

        const supabase = createAuthClient(req.token);
        const { error } = await supabase
            .from("user_posts")
            .delete()
            .eq("id", id);

        if (error) throw error;

        return res.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting post:", error);
        return res.status(500).json({ error: "Failed to delete post", details: error.message });
    }
};
