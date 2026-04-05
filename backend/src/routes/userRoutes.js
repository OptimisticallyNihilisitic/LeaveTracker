import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import * as userController from "../controllers/userController.js";

const router = express.Router();

router.get("/me", authenticate, userController.getMe);
router.get("/policy", authenticate, userController.getCurrentPolicy);

export default router;