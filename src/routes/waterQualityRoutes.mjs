import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.mjs';
import { checkRole } from '../middleware/roleMiddleware.mjs';
import {
  getDashboardStatistics,
} from '../controllers/waterQualityController.mjs';

const router = express.Router();

// Dashboard & Overview Routes (accessible to all authenticated users)
router.get('/dashboard', authenticateJWT, getDashboardStatistics);

export default router;