import { Request, Response, NextFunction } from 'express';
import { getAdminClient } from '../utils/supabaseClient';

// Augment express Request type to include user and token
declare global {
  namespace Express {
    interface Request {
      user?: any;
      token?: string;
    }
  }
}

/**
 * Middleware to verify a Supabase JWT Token
 */
export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const token = authHeader.split(' ')[1];
    const supabase = getAdminClient();
    
    // Verify user JWT against Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);

    if (error || !user) {
        return res.status(401).json({ error: 'Unauthorized. Invalid token.' });
    }

    req.user = user;
    req.token = token;
    next();
};
