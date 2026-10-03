import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireRateLimit } from '../middleware/rateLimit';
import { getConfig } from '../controllers/configController';
import { handleAnalyze, handleTopics, handleGenerateOutline, handleGeneratePost, handleRegenerateDNA } from '../controllers/analyzerController';
import { getPosts, addPost, deletePost } from '../controllers/postController';
import { getTokenUsage } from '../controllers/usageController';

const router = Router();

// Public routes
router.get('/config', getConfig);

// Protected routes
// requiredAuth middleware adds user and token in the req object
// requireRateLimit middleware intercepts and enforces the LLM token limit
router.post('/analyze', requireAuth, requireRateLimit, handleAnalyze);
router.post('/analyze/regenerate', requireAuth, requireRateLimit, handleRegenerateDNA);
router.post('/topics', requireAuth, requireRateLimit, handleTopics);
router.post('/outline', requireAuth, requireRateLimit, handleGenerateOutline);
router.post('/generate', requireAuth, requireRateLimit, handleGeneratePost);

// Training Data (Posts) Management
router.get('/posts', requireAuth, getPosts);
router.post('/posts', requireAuth, addPost);
router.delete('/posts/:id', requireAuth, deletePost);

// Token Usage
router.get('/tokens/usage', requireAuth, getTokenUsage);

export default router;
