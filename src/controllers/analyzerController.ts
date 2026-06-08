import { Request, Response } from 'express';
import { analyzePosts, generateTopics, generatePost } from '../services/analyzer';
import { createAuthClient } from '../utils/supabaseClient';

export const handleAnalyze = async (req: Request, res: Response): Promise<any> => {
  try {
    const { posts } = req.body;

    if (!posts || !Array.isArray(posts) || posts.length === 0) {
      return res.status(400).json({ error: 'Please provide an array of posts.' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    }

    const dnaProfile = await analyzePosts(posts);

    // Save to Database
    if (req.user && req.token) {
        const userClient = createAuthClient(req.token);
        
        const { error } = await userClient
            .from('user_dna')
            .upsert({
                user_id: req.user.id,
                dna_profile: dnaProfile,
                updated_at: new Date().toISOString()
            }, { onConflict: 'user_id' }); // Requires user_id to be unique

        if (error) {
            console.error("Failed to save DNA to database:", error);
            // We still return the profile even if DB save fails to not break the UI
        }
    }

    return res.json(dnaProfile);
  } catch (error: any) {
    console.error("Error analyzing posts:", error);
    return res.status(500).json({ error: 'Failed to analyze posts', details: error.message });
  }
};

export const handleTopics = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dnaProfile } = req.body;

    if (!dnaProfile) {
      return res.status(400).json({ error: 'Please provide a dnaProfile.' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    }
    
    // Check if TAVILY_API_KEY exists, if not it will fallback in the analyzer
    if (!process.env.TAVILY_API_KEY) {
      console.warn('TAVILY_API_KEY is missing, trend analysis will rely on base LLM knowledge.');
    }

    const topics = await generateTopics(dnaProfile);
    return res.json(topics);
  } catch (error: any) {
    console.error("Error generating topics:", error);
    return res.status(500).json({ error: 'Failed to generate topics', details: error.message });
  }
};

export const handleGeneratePost = async (req: Request, res: Response): Promise<any> => {
  try {
    const { dnaProfile, topic } = req.body;

    if (!dnaProfile || !topic || !topic.title) {
      return res.status(400).json({ error: 'Please provide dnaProfile and topic with a title.' });
    }

    if (!process.env.GROQ_API_KEY) {
      return res.status(500).json({ error: 'GROQ_API_KEY is not configured on the server.' });
    }

    const postContent = await generatePost(dnaProfile, topic);
    return res.json({ post: postContent });
  } catch (error: any) {
    console.error("Error generating post:", error);
    return res.status(500).json({ error: 'Failed to generate post', details: error.message });
  }
};
