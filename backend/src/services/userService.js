import supabase from "../config/supabaseClient.js";

export const getUserProfile = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, employee_id, name, email, role, manager_id, sick_leaves, casual_leaves, floater_leaves, created_at")
    .eq("id", userId)
    .single();

  if (error) throw error;
  return data;
};