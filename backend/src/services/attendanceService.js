import supabase from "../config/supabaseClient.js";

export const getMyAttendance = async (userId) => {
  const { data, error } = await supabase
    .from("attendance_logs")
    .select("*")
    .eq("user_id", userId)
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
};

export const requestRegularization = async ({ userId, date, reason }) => {
  // Find existing attendance log for that date
  const { data: existing, error: fetchError } = await supabase
    .from("attendance_logs")
    .select("id, regularization_requested")
    .eq("user_id", userId)
    .eq("date", date)
    .single();

  if (fetchError || !existing) throw new Error("Attendance record not found for that date");
  if (existing.regularization_requested) throw new Error("Regularization already requested for this date");

  const { data, error } = await supabase
    .from("attendance_logs")
    .update({
      regularization_requested: true,
      regularization_reason: reason,
      regularization_status: "pending",
    })
    .eq("id", existing.id)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const getTeamAttendance = async (managerId) => {
  // Get all users under this manager
  const { data: teamUsers, error: usersError } = await supabase
    .from("users")
    .select("id")
    .eq("manager_id", managerId);

  if (usersError) throw usersError;

  const teamIds = teamUsers.map((u) => u.id);

  if (teamIds.length === 0) return [];

  const { data, error } = await supabase
    .from("attendance_logs")
    .select("*, users(name, email, employee_id)")
    .in("user_id", teamIds)
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
};