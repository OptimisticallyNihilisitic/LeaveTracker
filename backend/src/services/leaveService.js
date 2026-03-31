import supabase from "../config/supabaseClient.js";

export const applyLeave = async ({ userId, managerId, leave_type, start_date, end_date, days, reason }) => {
  const { data, error } = await supabase
    .from("leave_requests")
    .insert({
      user_id: userId,
      manager_id: managerId,
      leave_type,
      start_date,
      end_date,
      days,
      reason,
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
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, users(name, email, employee_id)")
    .eq("manager_id", managerId)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return data;
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