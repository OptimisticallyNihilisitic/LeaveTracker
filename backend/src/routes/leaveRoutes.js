import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import * as leaveController from "../controllers/leaveController.js";

const router = express.Router();

// Employee and Manager shared routes
router.post("/apply", authenticate, authorizeRoles("employee", "manager"), leaveController.applyLeave);
router.delete("/:id", authenticate, authorizeRoles("employee", "manager"), leaveController.cancelLeave);
router.get("/my", authenticate, authorizeRoles("employee", "manager"), leaveController.getMyLeaves);

// Manager routes
router.get("/team", authenticate, authorizeRoles("manager"), leaveController.getTeamLeaves);
router.patch("/:id/review", authenticate, authorizeRoles("manager"), leaveController.reviewLeave);

export default router;