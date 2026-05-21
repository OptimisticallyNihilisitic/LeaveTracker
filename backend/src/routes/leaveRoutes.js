import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import * as leaveController from "../controllers/leaveController.js";

const router = express.Router();

// Employee, Manager, HR, Admin shared routes
router.post("/apply", authenticate, authorizeRoles("employee", "manager", "hr", "admin"), leaveController.applyLeave);
router.delete("/:id", authenticate, authorizeRoles("employee", "manager", "hr", "admin"), leaveController.cancelLeave);
router.get("/my", authenticate, authorizeRoles("employee", "manager", "hr", "admin"), leaveController.getMyLeaves);

// Manager/Team routes
router.get("/team", authenticate, authorizeRoles("manager", "hr", "admin"), leaveController.getTeamLeaves);
router.patch("/:id/review", authenticate, authorizeRoles("manager", "hr", "admin"), leaveController.reviewLeave);

// HR routes
router.get("/hr/pending", authenticate, authorizeRoles("hr"), leaveController.getHrLeaves);
router.patch("/:id/hr-review", authenticate, authorizeRoles("hr"), leaveController.hrReviewLeave);

// Admin routes
router.get("/admin/pending", authenticate, authorizeRoles("admin"), leaveController.getAdminLeaves);
router.patch("/:id/admin-review", authenticate, authorizeRoles("admin"), leaveController.adminReviewLeave);

export default router;