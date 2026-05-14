import supabase from "../config/supabaseClient.js";
import { sendInvitationEmail } from "./emailService.js";

//Users
export const getAllUsers = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });

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


//Policies
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

//Holidays
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

//Leave (admin view)

export const getAllLeaves = async () => {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, users(name, email, employee_id)")
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return data;
};

//Attendance (admin view)

export const getAllAttendance = async () => {
  const { data, error } = await supabase
    .from("attendance_logs")
    .select("*, users(name, email, employee_id)")
    .order("date", { ascending: false });

  if (error) throw error;
  return data;
};

//Auth User Creation

export const createUserWithAuth = async ({ email, password, name, employee_id, role, manager_id }) => {
 
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true, 
  });

  if (authError) throw new Error(authError.message);

  const userId = authData.user.id;

  const normalizedRole = (role ?? "employee").toLowerCase();
 
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
    
    const { data: fallback } = await supabase
      .from("policies")
      .select("sick_leaves, casual_leaves, floater_leaves")
      .order("year", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (fallback) defaultPolicy = fallback;
  }

 
  if (manager_id) {
    const { data: mgr, error: mgrError } = await supabase
      .from("users")
      .select("role")
      .eq("id", manager_id)
      .single();
    if (mgrError || !mgr) throw new Error("Assigned manager not found");
    if (!['manager', 'hr', 'admin'].includes(mgr.role)) {
      throw new Error("Reporting manager must have the Manager, HR, or Admin role");
    }
  }

  const { data, error } = await supabase
    .from("users")
    .insert({
      id: userId,
      email,
      name,
      employee_id,
      role: normalizedRole,
      manager_id: manager_id ?? null,
      sick_leaves: defaultPolicy.sick_leaves,
      casual_leaves: defaultPolicy.casual_leaves,
      floater_leaves: defaultPolicy.floater_leaves,
    })
    .select()
    .single();

  if (error) {
    await supabase.auth.admin.deleteUser(userId); //To prevent orphanaged accounts
    throw new Error(error.message);
  }

  return data;
};

export const deleteUserWithAuth = async (userId) => {
  // Remove user as manager from any pending invitations to avoid foreign key violations
  await supabase
    .from("invitations")
    .update({ manager_id: null })
    .eq("manager_id", userId);

  const { error: dbError } = await supabase
    .from("users")
    .delete()
    .eq("id", userId);

  if (dbError) throw new Error(dbError.message);

  const { error: authError } = await supabase.auth.admin.deleteUser(userId);
  if (authError) throw new Error(authError.message);

  return { message: "User deleted" };
};

export const assignManager = async (userId, managerId) => {
  
  if (userId === managerId) throw new Error("A user cannot be their own manager");

  if (managerId) {
    const { data: mgr, error: mgrError } = await supabase
      .from("users")
      .select("role")
      .eq("id", managerId)
      .single();
    if (mgrError || !mgr) throw new Error("Assigned manager not found");
    if (!['manager', 'hr', 'admin'].includes(mgr.role)) {
      throw new Error("Reporting manager must have the Manager, HR, or Admin role");
    }
  }

  const { data, error } = await supabase
    .from("users")
    .update({ manager_id: managerId ?? null, updated_at: new Date().toISOString() })
    .eq("id", userId)
    .select()
    .single();

  if (error) throw new Error(error.message);

  await supabase
    .from("leave_requests")
    .update({ manager_id: managerId ?? null })
    .eq("user_id", userId)
    .eq("status", "pending");

  return data;
};

// Invitations

export const createInvitation = async ({ email, name, employee_id, role, manager_id }) => {
  // Check if user already exists
  const { data: existingUser } = await supabase.from('users').select('id').eq('email', email).maybeSingle();
  if (existingUser) throw new Error("A user with this email already exists");

  // Check if invitation already exists and is pending
  const { data: existingInv } = await supabase.from('invitations').select('id, token').eq('email', email).eq('status', 'pending').maybeSingle();
  if (existingInv) throw new Error("A pending invitation for this email already exists");

  const { data, error } = await supabase
    .from("invitations")
    .insert({
      email,
      name,
      employee_id,
      role: String(role || "employee").toLowerCase(),
      manager_id: manager_id || null,
      status: "pending",
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  await sendInvitationEmail(email, name, data.token);

  return data;
};

export const getInvitations = async () => {
  const { data, error } = await supabase
    .from("invitations")
    .select("*, users!manager_id(name, email)")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
};

export const cancelInvitation = async (id) => {
  const { data, error } = await supabase
    .from("invitations")
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
};

export const resendInvitation = async (id) => {
  const { data: inv, error: fetchError } = await supabase
    .from("invitations")
    .select("*")
    .eq("id", id)
    .single();

  if (fetchError) throw new Error(fetchError.message);
  if (inv.status !== 'pending') throw new Error("Can only resend pending invitations");

  const newToken = crypto.randomUUID();
  const { data: updatedInv, error: updateError } = await supabase
    .from("invitations")
    .update({ token: newToken, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();

  if (updateError) throw new Error(updateError.message);

  await sendInvitationEmail(updatedInv.email, updatedInv.name, updatedInv.token);

  return updatedInv;
};
