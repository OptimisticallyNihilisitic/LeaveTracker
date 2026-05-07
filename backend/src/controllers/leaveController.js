import * as leaveService from "../services/leaveService.js";

export const applyLeave = async (req, res) => {
  try {
    const { leave_type, start_date, end_date, days, reason } = req.body;

    if (!leave_type || !start_date || !end_date || !days || !reason) {
      return res.status(400).json({ error: "Please select start and end date, leave type and reason." });
    }

    const data = await leaveService.applyLeave({
      userId: req.user.id,
      leave_type,
      start_date,
      end_date,
      days,
      reason,
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelLeave = async (req, res) => {
  try {
    const data = await leaveService.cancelLeave(req.params.id, req.user.id);
    res.json(data);
  } catch (err) {
    const status = err.message === "Forbidden" ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
};

export const getMyLeaves = async (req, res) => {
  try {
    const data = await leaveService.getMyLeaves(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getTeamLeaves = async (req, res) => {
  try {
    const data = await leaveService.getTeamLeaves(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const reviewLeave = async (req, res) => {
  try {
    const { status, comments } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    }

    const data = await leaveService.reviewLeave({
      leaveId: req.params.id,
      managerId: req.user.id,
      status,
      comments,
    });

    res.json(data);
  } catch (err) {
    const status = err.message === "Forbidden" ? 403 : 400;
    res.status(status).json({ error: err.message });
  }
};

export const getHrLeaves = async (req, res) => {
  try {
    const data = await leaveService.getHrLeaves();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const hrReviewLeave = async (req, res) => {
  try {
    const { status, comments } = req.body;

    if (!status || !["approved", "rejected"].includes(status)) {
      return res.status(400).json({ error: "status must be 'approved' or 'rejected'" });
    }

    const data = await leaveService.hrReviewLeave({
      leaveId: req.params.id,
      status,
      comments,
    });

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};