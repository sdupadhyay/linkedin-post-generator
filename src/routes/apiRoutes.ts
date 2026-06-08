import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getConfig } from '../controllers/configController';
import { handleAnalyze, handleTopics, handleGeneratePost } from '../controllers/analyzerController';

const router = Router();

// Public routes
router.get('/config', getConfig);

// Protected routes
router.post('/analyze', requireAuth, handleAnalyze);
router.post('/topics', requireAuth, handleTopics);
router.post('/generate', requireAuth, handleGeneratePost);

export default router;
