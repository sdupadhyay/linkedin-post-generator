import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRateLimit } from '../middleware/rateLimit';
import { getConfig } from '../controllers/configController';
import { handleAnalyze, handleTopics, handleGenerateOutline, handleGeneratePost } from '../controllers/analyzerController';

const router = Router();

// Public routes
router.get('/config', getConfig);

// Protected routes
// requiredAuth middleware adds user and token in the req object
// requireRateLimit middleware intercepts and enforces the 10K LLM token limit
router.post('/analyze', requireAuth, requireRateLimit, handleAnalyze);
router.post('/topics', requireAuth, requireRateLimit, handleTopics);
router.post('/outline', requireAuth, requireRateLimit, handleGenerateOutline);
router.post('/generate', requireAuth, requireRateLimit, handleGeneratePost);

export default router;
