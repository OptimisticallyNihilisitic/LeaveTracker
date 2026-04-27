import express from "express";
import * as inviteController from "../controllers/inviteController.js";

const router = express.Router();

router.get("/:token", inviteController.getInvitationDetails);
router.post("/:token/accept", inviteController.acceptInvitation);

export default router;
