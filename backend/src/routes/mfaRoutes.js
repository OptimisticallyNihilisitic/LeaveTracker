import express from 'express';
import { initiateLogin, verifyOtp } from '../controllers/mfaController.js';

const router = express.Router();

// Step 1 — validate email+password → send OTP
router.post('/login', initiateLogin);

// Step 2 — verify OTP → receive session tokens
router.post('/verify-otp', verifyOtp);

export default router;
