import express from "express";
import authenticate from "../middleware/authMiddleware.js";
import authorizeRoles from "../middleware/roleMiddleware.js";
import * as adminController from "../controllers/adminController.js";

const router = express.Router();

const adminOnly = [authenticate, authorizeRoles("admin")];
const anyRole   = [authenticate];

//Users (admin only)
router.get("/users",             ...adminOnly, adminController.getAllUsers); //List all user
router.post("/users",            ...adminOnly, adminController.createUserWithAuth); // create a user
router.patch("/users/:id",       ...adminOnly, adminController.updateUser); //update a user
router.delete("/users/:id",      ...adminOnly, adminController.deleteUserWithAuth); //delete a user
router.patch("/users/:id/manager", ...adminOnly, adminController.assignManager); //update manager for a user - assign or remove

//Policies (read: all | write: admin)
router.get("/policies",  ...anyRole,   adminController.getPolicies); //List all policies
router.post("/policies", ...adminOnly, adminController.upsertPolicy); //Add policy - also updates policies for all employees

//Holidays (read: all | write: admin)
router.get("/holidays",        ...anyRole,   adminController.getHolidays); //Get all holidays
router.post("/holidays",       ...adminOnly, adminController.addHoliday); //Create a holiday
router.delete("/holidays/:id", ...adminOnly, adminController.deleteHoliday); //Delete a holiday

//Leave & Attendance (admin read-only)
router.get("/leave",      ...adminOnly, adminController.getAllLeaves); //View all leave req across org
router.get("/attendance", ...adminOnly, adminController.getAllAttendance); 

//Invitations (admin only)
router.get("/invitations",             ...adminOnly, adminController.getInvitations); //View all invitations
router.post("/invitations",            ...adminOnly, adminController.createInvitation); //Create an invitation
router.patch("/invitations/:id/cancel",...adminOnly, adminController.cancelInvitation); //Cancel an invitation
router.post("/invitations/:id/resend", ...adminOnly, adminController.resendInvitation); //Resend for existing invitation

export default router;