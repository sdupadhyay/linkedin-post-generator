import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getConfig } from '../controllers/configController';
import { handleAnalyze, handleTopics, handleGeneratePost } from '../controllers/analyzerController';

const router = Router();

// Public routes
router.get('/config', getConfig);

// Protected routes
// requiredAuth mddleware addes user and token in the req object
router.post('/analyze', requireAuth, handleAnalyze);
router.post('/topics', requireAuth, handleTopics);
router.post('/generate', requireAuth, handleGeneratePost);

export default router;
