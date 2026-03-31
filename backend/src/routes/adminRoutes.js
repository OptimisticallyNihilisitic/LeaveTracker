import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

// All admin routes require authentication + admin role
router.use(authenticate, authorizeRoles("admin"));

// Users
router.get("/users", adminController.getAllUsers);
router.post("/users", adminController.createUserWithAuth);     
router.patch("/users/:id", adminController.updateUser);
router.delete("/users/:id", adminController.deleteUserWithAuth);
router.patch("/users/:id/manager", adminController.assignManager);

// Policies
router.get("/policies", adminController.getPolicies);
router.post("/policies", adminController.upsertPolicy);

// Holidays
router.get("/holidays", adminController.getHolidays);
router.post("/holidays", adminController.addHoliday);
router.delete("/holidays/:id", adminController.deleteHoliday);

// Leave & Attendance (read-only for admin)
router.get("/leave", adminController.getAllLeaves);
router.get("/attendance", adminController.getAllAttendance);

export default router;