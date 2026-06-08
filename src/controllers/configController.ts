import { Request, Response } from 'express';

export const getConfig = (req: Request, res: Response) => {
    res.json({
        supabaseUrl: process.env.SUPABASE_URL,
        supabaseAnonKey: process.env.SUPABASE_ANON_KEY
    });
};
