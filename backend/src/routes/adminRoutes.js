import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

const adminOnly = [authenticate, authorizeRoles("admin")];
const anyRole   = [authenticate];

// ── Users (admin only) ─────────────────────────────────
router.get("/users",             ...adminOnly, adminController.getAllUsers);
router.post("/users",            ...adminOnly, adminController.createUserWithAuth);
router.patch("/users/:id",       ...adminOnly, adminController.updateUser);
router.delete("/users/:id",      ...adminOnly, adminController.deleteUserWithAuth);
router.patch("/users/:id/manager", ...adminOnly, adminController.assignManager);

// ── Policies (read: all | write: admin) ────────────────
router.get("/policies",  ...anyRole,   adminController.getPolicies);
router.post("/policies", ...adminOnly, adminController.upsertPolicy);

// ── Holidays (read: all | write: admin) ────────────────
router.get("/holidays",        ...anyRole,   adminController.getHolidays);
router.post("/holidays",       ...adminOnly, adminController.addHoliday);
router.delete("/holidays/:id", ...adminOnly, adminController.deleteHoliday);

// ── Leave & Attendance (admin read-only) ───────────────
router.get("/leave",      ...adminOnly, adminController.getAllLeaves);
router.get("/attendance", ...adminOnly, adminController.getAllAttendance);

export default router;