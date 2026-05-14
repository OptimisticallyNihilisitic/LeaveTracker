import * as attendanceService from "../services/attendanceService.js";

export const getMyAttendance = async (req, res) => {
  try {
    const data = await attendanceService.getMyAttendance(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
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