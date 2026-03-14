import express from 'express';
import { authenticateJWT } from '../middleware/authMiddleware.mjs';
import { checkRole } from '../middleware/roleMiddleware.mjs';
import {
  getDashboardStatistics,
  getMeanStatistics,
  getVarianceStatistics,
  getStandardDeviationStatistics,
  getMedianStatistics,
  getMinMaxStatistics,
  getDailyStatistics,
  getWeeklyStatistics,
  getMonthlyStatistics,
  getTrendAnalysis,
  getMovingAverage,
  getParameterCorrelation,
  detectOutliers,
  getWaterQualityClassification,
  getWaterStabilityScore,
  getDistrictStatistics,
 getTreatmentPlantStatistics  
} from '../controllers/waterQualityController.mjs';

const router = express.Router();

// ====================== PUBLIC PROTECTED ROUTES ======================
// Accessible to all authenticated users
// router.get('/latest', authenticateJWT, getLatestWaterQuality);
// router.get('/history', authenticateJWT, getWaterQualityHistory);
// router.get('/stats', authenticateJWT, getWaterQualityStats);
// router.get('/index', authenticateJWT, getWaterQualityIndex);

// ====================== ADVANCED STATISTICS ROUTES ======================
// All statistics are protected with authentication
router.get('/stats/dashboard',          authenticateJWT, getDashboardStatistics);
router.get('/stats/mean',               authenticateJWT, getMeanStatistics);
router.get('/stats/variance',           authenticateJWT, getVarianceStatistics);
router.get('/stats/std-dev',            authenticateJWT, getStandardDeviationStatistics);
router.get('/stats/median',             authenticateJWT, getMedianStatistics);
router.get('/stats/min-max',            authenticateJWT, getMinMaxStatistics);
router.get('/stats/daily',              authenticateJWT, getDailyStatistics);
router.get('/stats/weekly',             authenticateJWT, getWeeklyStatistics);
router.get('/stats/monthly',            authenticateJWT, getMonthlyStatistics);
router.get('/stats/trend',              authenticateJWT, getTrendAnalysis);
router.get('/stats/moving-average',     authenticateJWT, getMovingAverage);
router.get('/stats/correlation',        authenticateJWT, getParameterCorrelation);
router.get('/stats/outliers',           authenticateJWT, detectOutliers);
router.get('/stats/classification',     authenticateJWT, getWaterQualityClassification);
router.get('/stats/stability-score',    authenticateJWT, getWaterStabilityScore);
router.get('/stats/district',           authenticateJWT, getDistrictStatistics);
router.get('/stats/treatment-plant',    authenticateJWT, getTreatmentPlantStatistics);

// ====================== ADMIN / OFFICER ONLY ROUTES ======================
// router.post('/manual', authenticateJWT, checkRole(['admin', 'superadmin', 'officer']), addWaterQualityDataManual);
// router.post('/',       authenticateJWT, checkRole(['admin', 'superadmin', 'officer']), addWaterQualityData);
// router.put('/:id',     authenticateJWT, checkRole(['admin', 'superadmin', 'officer']), updateWaterQualityData);
// router.delete('/:id',  authenticateJWT, checkRole(['admin', 'superadmin', 'officer']), deleteWaterQualityData);

// Location-Based Routes (accessible to all authenticated users)
router.get('/district/:district', authenticateJWT, getDistrictStatistics);
router.get('/plant/:plantId', authenticateJWT, getTreatmentPlantStatistics);
export default router;