import express from 'express';
import {
  register,
  login,
  getMe,
  getDemoAccounts,
  resetSeed,
  applyForOrganizer,
  sendRegistrationOtp,
  sendForgotPasswordOtp,
  resetPasswordWithOtp,
} from '../controllers/authController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// Registration with Marwadi University OTP Verification
router.post('/send-registration-otp', sendRegistrationOtp);
router.post('/register', register);

// Forgot Password with OTP Verification
router.post('/forgot-password-otp', sendForgotPasswordOtp);
router.post('/reset-password-otp', resetPasswordWithOtp);

// Standard Auth
router.post('/login', login);
router.get('/me', protect, getMe);
router.post('/apply-organizer', protect, applyForOrganizer);
router.get('/demo-accounts', getDemoAccounts);
router.post('/reset-seed', resetSeed);

export default router;
