import supabase from "../config/supabaseClient.js";

export const applyLeave = async ({ userId, leave_type, start_date, end_date, days, reason }) => {
  // Always look up the employee's current manager and role fresh from the users table
  const { data: employee, error: empError } = await supabase
    .from("users")
    .select("manager_id, role")
    .eq("id", userId)
    .single();

  if (empError) throw new Error(empError.message);

  if (!employee.manager_id && employee.role !== 'manager' && employee.role !== 'admin') {
    throw new Error("You cannot apply for a leave because no manager is assigned to you. Please contact admin.");
  }

  // Check for overlapping leaves
  const { data: overlappingLeaves, error: overlapError } = await supabase
    .from("leave_requests")
    .select("id")
    .eq("user_id", userId)
    .in("status", ["pending", "approved"])
    .lte("start_date", end_date)
    .gte("end_date", start_date);

  if (overlapError) throw new Error(overlapError.message);
  if (overlappingLeaves && overlappingLeaves.length > 0) {
    throw new Error("You already have an active leave request during the selected dates.");
  }

  let initialStatus = 'pending';
  if (employee.role === 'admin') {
    initialStatus = 'approved';
  } else if (employee.role === 'manager') {
    if (!employee.manager_id) {
      initialStatus = 'approved';
    } else {
      initialStatus = 'pending';
    }
  }

  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      user_id: userId,
      manager_id: employee.manager_id ?? null,
      leave_type,
      start_date,
      end_date,
      days,
      reason,
      status: initialStatus,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const cancelLeave = async (leaveId, userId) => {
  // Only allow cancellation of pending leaves owned by the user
  const { data: existing, error: fetchError } = await supabase
    .from("leave_requests")
    .select("id, status, user_id")
    .eq("id", leaveId)
    .single();

  if (fetchError || !existing) throw new Error("Leave request not found");
  if (existing.user_id !== userId) throw new Error("Forbidden");
  if (existing.status !== "pending") throw new Error("Only pending leaves can be cancelled");

  const { error } = await supabase
    .from("leave_requests")
    .delete()
    .eq("id", leaveId);

  if (error) throw error;
  return { message: "Leave request cancelled" };
};

export const getMyLeaves = async (userId) => {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("user_id", userId)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const getTeamLeaves = async (managerId) => {
  // First get all leave requests for this manager
  const { data: leaves, error: leavesError } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("manager_id", managerId)
    .order("applied_at", { ascending: false });

  if (leavesError) throw leavesError;
  if (!leaves || leaves.length === 0) return [];

  // Then enrich with user info
  const userIds = [...new Set(leaves.map((l) => l.user_id))];

  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, name, email, employee_id")
    .in("id", userIds);

  if (usersError) throw usersError;

  const userMap = Object.fromEntries(users.map((u) => [u.id, u]));

  return leaves.map((l) => ({
    ...l,
    users: userMap[l.user_id] ?? null,
  }));
};

export const reviewLeave = async ({ leaveId, managerId, status, comments }) => {
  // Verify this leave belongs to this manager
  const { data: existing, error: fetchError } = await supabase
    .from("leave_requests")
    .select("id, status, manager_id")
    .eq("id", leaveId)
    .single();

  if (fetchError || !existing) throw new Error("Leave request not found");
  if (existing.manager_id !== managerId) throw new Error("Forbidden");
  if (existing.status !== "pending") throw new Error("Leave already reviewed");

  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      status,
      comments,
      reviewed_by: managerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", leaveId)
    .select()
    .single();

  if (error) throw error;
  return data;
};