import { Request, Response } from 'express';
import { createAuthClient } from '../utils/supabaseClient';
import { DAILY_TOKEN_LIMIT } from '../services/usageTracker';

export const getTokenUsage = async (req: Request, res: Response) => {
    try {
        const user = (req as any).user;
        const token = (req as any).token;

        if (!user || !token) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const supabase = createAuthClient(token);
        
        const { data: limitData, error } = await supabase
            .from('user_token_limits')
            .select('daily_tokens_used, last_reset')
            .eq('user_id', user.id)
            .maybeSingle();

        if (error) {
            console.error("Error fetching token usage:", error);
            return res.status(500).json({ error: 'Failed to fetch token usage' });
        }

        let currentUsage = 0;

        if (limitData) {
            // Lazy reset check for the UI to display 0 if 24h passed
            const lastResetDate = new Date(limitData.last_reset);
            const now = new Date();
            const hoursSinceReset = Math.abs(now.getTime() - lastResetDate.getTime()) / 36e5;
            
            if (hoursSinceReset >= 24) {
                currentUsage = 0;
            } else {
                currentUsage = limitData.daily_tokens_used;
            }
        }

        return res.json({
            total_token_limit: DAILY_TOKEN_LIMIT,
            current_usage: currentUsage
        });
    } catch (error: any) {
        console.error("Error in getTokenUsage:", error);
        return res.status(500).json({ error: error.message || 'Internal server error' });
    }
};
