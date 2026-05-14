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

export const getTeamAttendance = async (managerId) => {
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