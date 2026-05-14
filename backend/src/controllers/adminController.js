import * as adminService from "../services/adminService.js";

//Users 
export const getAllUsers = async (req, res) => {
  try {
    const data = await adminService.getAllUsers();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const { employee_id, name, email, role, manager_id, sick_leaves, casual_leaves, floater_leaves } = req.body;

    if (!employee_id || !name || !email || !role) {
      return res.status(400).json({ error: "employee_id, name, email and role are required" });
    }

    const data = await adminService.createUser({
      employee_id, name, email, role, manager_id,
      sick_leaves, casual_leaves, floater_leaves,
    });
  
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const data = await adminService.updateUser(req.params.id, req.body);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const data = await adminService.deleteUser(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Policies

export const getPolicies = async (req, res) => {
  try {
    const data = await adminService.getPolicies();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const upsertPolicy = async (req, res) => {
  try {
    const { year, sick_leaves, casual_leaves, floater_leaves } = req.body;

    if (!year) {
      return res.status(400).json({ error: "year is required" });
    }

    const data = await adminService.upsertPolicy({ year, sick_leaves, casual_leaves, floater_leaves });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Holidays

export const getHolidays = async (req, res) => {
  try {
    const data = await adminService.getHolidays();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addHoliday = async (req, res) => {
  try {
    const { policy_id, name, date, is_floater } = req.body;

    if (!policy_id || !name || !date) {
      return res.status(400).json({ error: "policy_id, name and date are required" });
    }

    const data = await adminService.addHoliday({ policy_id, name, date, is_floater });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteHoliday = async (req, res) => {
  try {
    const data = await adminService.deleteHoliday(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//Leave & Attendance

export const getAllLeaves = async (req, res) => {
  try {
    const data = await adminService.getAllLeaves();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getAllAttendance = async (req, res) => {
  try {
    const data = await adminService.getAllAttendance();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const createUserWithAuth = async (req, res) => {
  try {
    const { email, password, name, employee_id, role, manager_id } = req.body;

    if (!email || !password || !name || !employee_id) {
      return res.status(400).json({ error: "email, password, name and employee_id are required" });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const validRoles = ["employee", "manager", "hr", "admin"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: "role must be employee, manager, hr or admin" });
    }

    if (!email.endsWith("@test.com")) {
      return res.status(400).json({ error: "Email must end with @test.com (company specific domain)" });
    }

    const existingUsers = await adminService.getAllUsers();
    const emailExists = existingUsers.some(u => u.email === email);
    if (emailExists) {
      return res.status(400).json({ error: "A user with this email already exists" });
    }
    
    // Check if there's a pending invitation for this email
    const existingInvitations = await adminService.getInvitations();
    const pendingInvitationExists = existingInvitations.some(inv => inv.email === email && inv.status === 'pending');
    if (pendingInvitationExists) {
      return res.status(400).json({ error: "A pending invitation for this email already exists. Cancel it before manually adding." });
    }

    const data = await adminService.createUserWithAuth({
      email, password, name, employee_id,
      role: role ?? "employee",
      manager_id: manager_id ?? null,
    });

    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteUserWithAuth = async (req, res) => {
  try {
    const data = await adminService.deleteUserWithAuth(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const assignManager = async (req, res) => {
  try {
    const { manager_id } = req.body;
    const data = await adminService.assignManager(req.params.id, manager_id ?? null);
    res.json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

// Invitations

export const createInvitation = async (req, res) => {
  try {
    const { email, name, employee_id, role, manager_id } = req.body;

    if (!email || !name || !employee_id) {
      return res.status(400).json({ error: "email, name, and employee_id are required" });
    }

    if (!email.endsWith("@test.com")) {
      return res.status(400).json({ error: "Email must end with @test.com (company specific domain)" });
    }

    const validRoles = ["employee", "manager", "hr", "admin"];
    if (role && !validRoles.includes(role)) {
      return res.status(400).json({ error: "role must be employee, manager, hr or admin" });
    }

    const data = await adminService.createInvitation({ email, name, employee_id, role, manager_id });
    res.status(201).json(data);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getInvitations = async (req, res) => {
  try {
    const data = await adminService.getInvitations();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const cancelInvitation = async (req, res) => {
  try {
    const data = await adminService.cancelInvitation(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const resendInvitation = async (req, res) => {
  try {
    const data = await adminService.resendInvitation(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
