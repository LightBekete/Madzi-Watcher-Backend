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
  getWeeklyStatistics,
  getMonthlyStatistics,
  getYearlyStatistics,
  getTrendAnalysis,
  getMovingAverage,
  getParameterCorrelation,
  detectOutliers,
  getWaterQualityClassification,
  getWaterStabilityScore,
  getDistrictStatistics,
  getTreatmentPlantStatistics,
} from '../controllers/waterQualityController.mjs';

const router = express.Router();

// Dashboard & Overview Routes (accessible to all authenticated users)
router.get('/dashboard', authenticateJWT, getDashboardStatistics);
router.get('/classification', authenticateJWT, getWaterQualityClassification);
router.get('/stability', authenticateJWT, getWaterStabilityScore);

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
router.get('/aggregations/weekly', authenticateJWT, getWeeklyStatistics);
router.get('/aggregations/monthly', authenticateJWT, getMonthlyStatistics);
router.get('/aggregations/yearly', authenticateJWT, getYearlyStatistics);

// Analysis Routes (accessible to all authenticated users)
router.get('/analysis/trends', authenticateJWT, getTrendAnalysis);
router.get('/analysis/moving-average', authenticateJWT, getMovingAverage);
router.get('/analysis/correlation', authenticateJWT, getParameterCorrelation);
router.get('/analysis/outliers', authenticateJWT, detectOutliers);

// Location-Based Routes (accessible to all authenticated users)
router.get('/district/:district', authenticateJWT, getDistrictStatistics);
router.get('/plant/:plantId', authenticateJWT, getTreatmentPlantStatistics);
export default router;