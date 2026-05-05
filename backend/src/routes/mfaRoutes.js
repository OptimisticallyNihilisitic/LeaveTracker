import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import * as mfaController from "../controllers/mfaController.js";

const router = express.Router();

// Public routes (for forgot password)
router.post("/send-reset-otp", mfaController.sendResetOtp);
router.post("/verify-reset-otp", mfaController.verifyResetOtp);

// Authenticated routes (for login MFA)
router.post("/check", authenticate, mfaController.checkMfa);
router.post("/verify", authenticate, mfaController.verifyMfa);

export default router;
