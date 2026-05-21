import express from 'express';
import { initiateLogin, verifyOtp } from '../controllers/mfaController.js';

const router = express.Router();

// validate email+password -> send OTP
router.post('/login', initiateLogin);

// verify OTP -> receive session tokens
router.post('/verify-otp', verifyOtp);

export default router;
