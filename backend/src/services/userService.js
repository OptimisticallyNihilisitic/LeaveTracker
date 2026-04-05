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

export const getCurrentPolicy = async () => {
  const currentYear = new Date().getFullYear();

  // Try current year first
  const { data, error } = await supabase
    .from("policies")
    .select("*")
    .eq("year", currentYear)
    .maybeSingle(); // use maybeSingle so it returns null instead of error when not found

  if (data) return data;

  // Fall back to most recent policy
  const { data: fallback, error: fallbackError } = await supabase
    .from("policies")
    .select("*")
    .order("year", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (fallbackError) throw new Error(fallbackError.message);

  // Return zeros if no policy exists at all — frontend handles this gracefully
  return fallback ?? {
    year: currentYear,
    sick_leaves: 0,
    casual_leaves: 0,
    floater_leaves: 0,
  };
};