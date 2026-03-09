import express from 'express';
//import router from './userRoutes.mjs';
import {
  registerUser,
  loginUser,
  logoutUser,
  refreshToken,
  requestPasswordReset,
  resetPassword,
  changePassword,
  verifyOtp
} from '../controllers/authController.mjs';
import { validateRequest } from '../middleware/validateRequest.mjs';
import { registerWaterMonitorSchema } from '../utils/validators.mjs';
import { authenticateJWT } from '../middleware/authMiddleware.mjs';
import { loginValidation,
  validateEmail,
  resetPasswordSchema, 
  validateChangePassword
} from '../utils/validators.mjs';
import { checkRole } from '../middleware/roleMiddleware.mjs';

const router = express.Router();


// Basic Auth Routes
router.post('/verify-otp',verifyOtp);
router.post('/register', authenticateJWT,checkRole(['superAdmin']),validateRequest(registerWaterMonitorSchema), registerUser);
router.post('/login', validateRequest(loginValidation), loginUser);
router.post('/logout', logoutUser);


// Token Refresh
router.post('/refresh-token', refreshToken);

// Password Management
router.post('/request-reset', validateRequest(validateEmail), requestPasswordReset);
router.post('/reset-password', validateRequest(resetPasswordSchema), resetPassword);
router.post('/change-password', authenticateJWT, validateRequest(validateChangePassword),  changePassword);


export default router;
