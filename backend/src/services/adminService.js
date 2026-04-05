import supabase from "../config/supabaseClient.js";

// ── Users ──────────────────────────────────────────────

export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const createUser = async (userData) => {
  const { data, error } = await supabase
    .from("users")
    .insert(userData)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const updateUser = async (userId, updates) => {
  const { data, error } = await supabase
    .from("users")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteUser = async (userId) => {
  const { error } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (error) throw error;
  return { message: "User deleted" };
};

// ── Policies ───────────────────────────────────────────

export const getPolicies = async () => {
  const { data, error } = await supabase
    .from("policies")
    .select("*, holidays(*)")
    .order("year", { ascending: false });

  if (error) throw error;
  return data;
};

export const upsertPolicy = async ({ year, sick_leaves, casual_leaves, floater_leaves }) => {
  const { data, error } = await supabase
    .from("policies")
    .upsert({ year, sick_leaves, casual_leaves, floater_leaves }, { onConflict: "year" })
    .select()
    .single();

  if (error) throw error;

  // Sync back to users
  await supabase.from("users").update({
      sick_leaves,
      casual_leaves,
      floater_leaves
  }).not('id', 'is', null);

  return data;
};

// ── Holidays ───────────────────────────────────────────

export const addHoliday = async ({ policy_id, name, date, is_floater }) => {
  const { data, error } = await supabase
    .from("holidays")
    .insert({ policy_id, name, date, is_floater: is_floater || false })
    .select()
    .single();

  if (error) throw error;
  return data;
};

export const deleteHoliday = async (holidayId) => {
  const { error } = await supabase
    .from("holidays")
    .delete()
    .eq("id", holidayId);

  if (error) throw error;
  return { message: "Holiday deleted" };
};

export const getHolidays = async () => {
  const { data, error } = await supabase
    .from("holidays")
    .select("*, policies(year)")
    .order("date", { ascending: true });

  if (error) throw error;
  return data;
};

// ── Leave (admin view) ─────────────────────────────────

export const getAllLeaves = async () => {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, users(name, email, employee_id)")
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return data;
};

// ── Attendance (admin view) ────────────────────────────

export const getAllAttendance = async () => {
  const { data, error } = await supabase
    .from("attendance_logs")
    .select("*, users(name, email, employee_id)")
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
};

// ── Auth User Creation ─────────────────────────────────

export const createUserWithAuth = async ({ email, password, name, employee_id, role, manager_id }) => {
  // Step 1: Create auth account via Supabase Admin API
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, // skip email verification
  });

  if (authError) throw new Error(authError.message);

  const userId = authData.user.id;

  // Get current policy to initialize balances
  const currentYear = new Date().getFullYear();
  let defaultPolicy = { sick_leaves: 0, casual_leaves: 0, floater_leaves: 0 };
  const { data: policyData } = await supabase
    .from("policies")
    .select("sick_leaves, casual_leaves, floater_leaves")
    .eq("year", currentYear)
    .maybeSingle();

  if (policyData) {
    defaultPolicy = policyData;
  } else {
    // try fallback
    const { data: fallback } = await supabase
      .from("policies")
      .select("sick_leaves, casual_leaves, floater_leaves")
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fallback) defaultPolicy = fallback;
  }

  // Step 2: Insert into users table using the same UUID
  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email,
      name,
      employee_id,
      role: role ?? "employee",
      manager_id: manager_id ?? null,
      sick_leaves: defaultPolicy.sick_leaves,
      casual_leaves: defaultPolicy.casual_leaves,
      floater_leaves: defaultPolicy.floater_leaves,
    })
    .select()
    .single();

  if (error) {
    // Rollback: delete the auth user if profile insert fails
    await supabase.auth.admin.deleteUser(userId);
    throw new Error(error.message);
  }

  return data;
};

export const deleteUserWithAuth = async (userId) => {
  // Delete from users table first (cascade will clean up related data)
  const { error: dbError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (dbError) throw new Error(dbError.message);

  // Then delete from Supabase Auth
  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw new Error(authError.message);

  return { message: "User deleted" };
};

export const assignManager = async (userId, managerId) => {
  // Prevent self-assignment
  if (userId === managerId) throw new Error("A user cannot be their own manager");

  const { data, error } = await supabase
    .from("users")
    .update({ manager_id: managerId ?? null, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  // Update pending leaves to be routed to the new manager!
  await supabase
    .from("leave_requests")
    .update({ manager_id: managerId ?? null })
    .eq("user_id", userId)
    .eq("status", "pending");

  return data;
};