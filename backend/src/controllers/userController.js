import { getUserProfile, getCurrentPolicy as getPolicyFromDB } from "../services/userService.js";

export const getMe = async (req, res) => {
  try {
    const data = await getUserProfile(req.user.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getCurrentPolicy = async (req, res) => {
  try {
    const data = await getPolicyFromDB();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};