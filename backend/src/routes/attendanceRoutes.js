import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import * as attendanceController from "../controllers/attendanceController.js";

const router = express.Router();

// Employee routes
router.get("/my", authenticate, authorizeRoles("employee"), attendanceController.getMyAttendance);
router.post("/regularize", authenticate, authorizeRoles("employee"), attendanceController.requestRegularization);

// Manager routes
router.get("/team", authenticate, authorizeRoles("manager"), attendanceController.getTeamAttendance);

export default router;