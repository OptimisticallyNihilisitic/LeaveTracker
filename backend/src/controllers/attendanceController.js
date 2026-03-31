import * as attendanceService from "../services/attendanceService.js";

export const getMyAttendance = async (req, res) => {
  try {
    const data = await attendanceService.getMyAttendance(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const requestRegularization = async (req, res) => {
  try {
    const { date, reason } = req.body;

    if (!date || !reason) {
      return res.status(400).json({ error: "date and reason are required" });
    }

    const data = await attendanceService.requestRegularization({
      userId: req.user.id,
      date,
      reason,
    });

    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getTeamAttendance = async (req, res) => {
  try {
    const data = await attendanceService.getTeamAttendance(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};