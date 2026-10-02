import { Request, Response, NextFunction } from 'express';
import { checkRateLimit } from '../services/usageTracker';

/**
 * Middleware to enforce the daily LLM token rate limit.
 * Must be used after requireAuth so that req.token and req.user exist.
 */
export const requireRateLimit = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    if (!req.token || !req.user || !req.user.id) {
        return res.status(401).json({ error: 'Unauthorized. Missing token or user context.' });
    }

    try {
        await checkRateLimit(req.token, req.user.id);
        next();
    } catch (error: any) {
        // We catch the error thrown by checkRateLimit and return it as a 429 status code
        return res.status(429).json({ error: error.message || 'Rate limit exceeded.' });
    }
};
