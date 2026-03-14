import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.mjs';
import { checkRole } from '../middleware/roleMiddleware.mjs';
import {
  getDashboardStatistics,
  getWaterQualityHistory,
  getMeanStatistics,
  getVarianceStatistics,
  getStandardDeviationStatistics,
  getMedianStatistics,
  getMinMaxStatistics,
  getDailyStatistics,
} from '../controllers/waterQualityController.mjs';

const router = express.Router();

// Dashboard & Overview Routes (accessible to all authenticated users)
router.get('/dashboard', authenticateJWT, getDashboardStatistics);

// Get water quality data (accessible to all authenticated users)
router.get('/history', authenticateJWT, getWaterQualityHistory);

// Statistical Measures Routes (accessible to all authenticated users)
router.get('/statistics/mean', authenticateJWT, getMeanStatistics);
router.get('/statistics/variance', authenticateJWT, getVarianceStatistics);
router.get('/statistics/std-dev', authenticateJWT, getStandardDeviationStatistics);
router.get('/statistics/median', authenticateJWT, getMedianStatistics);
router.get('/statistics/min-max', authenticateJWT, getMinMaxStatistics);

// Time-Based Aggregation Routes (accessible to all authenticated users)
router.get('/aggregations/daily', authenticateJWT, getDailyStatistics);

export default router;