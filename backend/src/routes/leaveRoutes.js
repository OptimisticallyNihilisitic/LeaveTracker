import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import * as leaveController from "../controllers/leaveController.js";

const router = express.Router();

// Employee and Manager shared routes
router.post("/apply", authenticate, authorizeRoles("employee", "manager", "hr"), leaveController.applyLeave);
router.delete("/:id", authenticate, authorizeRoles("employee", "manager", "hr"), leaveController.cancelLeave);
router.get("/my", authenticate, authorizeRoles("employee", "manager", "hr"), leaveController.getMyLeaves);

// Manager routes
router.get("/team", authenticate, authorizeRoles("manager"), leaveController.getTeamLeaves);
router.patch("/:id/review", authenticate, authorizeRoles("manager"), leaveController.reviewLeave);

// HR routes
router.get("/hr/pending", authenticate, authorizeRoles("hr"), leaveController.getHrLeaves);
router.patch("/:id/hr-review", authenticate, authorizeRoles("hr"), leaveController.hrReviewLeave);

export default router;