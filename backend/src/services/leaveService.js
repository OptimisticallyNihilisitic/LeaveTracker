import supabase from "../config/supabaseClient.js";
import { sendLeaveApplicationEmail, sendLeaveApprovalEmail } from "./emailService.js";

const STATUS = {
  PENDING_MANAGER: "pending_manager",
  PENDING_HR: "pending_hr",
  APPROVED: "approved",
  REJECTED: "rejected",
};

export const applyLeave = async ({ userId, leave_type, start_date, end_date, days, reason }) => {
  const { data: employee, error: empError } = await supabase
    .from("users")
    .select("name, email, manager_id, role, sick_leaves, casual_leaves, floater_leaves")
    .eq("id", userId)
    .single();

  if (empError) throw new Error(empError.message);

  if (!employee.manager_id && employee.role !== 'manager' && employee.role !== 'admin' && employee.role !== 'hr') {
    throw new Error("You cannot apply for a leave because no manager is assigned to you. Please contact admin.");
  }

  const { data: overlappingLeaves, error: overlapError } = await supabase
    .from("leave_requests")
    .select("id")
    .eq("user_id", userId)
    .in("status", [STATUS.PENDING_MANAGER, STATUS.PENDING_HR, STATUS.APPROVED])
    .lte("start_date", end_date)
    .gte("end_date", start_date);

  if (overlapError) throw new Error(overlapError.message);
  if (overlappingLeaves && overlappingLeaves.length > 0) {
    throw new Error("You already have an active leave request during the selected dates.");
  }

  const balanceField = leave_type === "sick" ? "sick_leaves" : leave_type === "casual" ? "casual_leaves" : leave_type === "floater" ? "floater_leaves" : null;
  
  if (balanceField) {
    const { data: existingLeaves, error: existingLeavesError } = await supabase
      .from("leave_requests")
      .select("days")
      .eq("user_id", userId)
      .eq("leave_type", leave_type)
      .in("status", [STATUS.APPROVED, STATUS.PENDING_MANAGER, STATUS.PENDING_HR]);

    if (existingLeavesError) throw new Error(existingLeavesError.message);
    
    const consumedLeaves = existingLeaves ? existingLeaves.reduce((acc, l) => acc + (l.days || 0), 0) : 0;
    const availableBalance = employee[balanceField] ?? 0;

    if (availableBalance < days) {
      const displayType = leave_type.charAt(0).toUpperCase() + leave_type.slice(1);
      throw new Error(`Insufficient balance. You only have ${availableBalance} ${displayType} Leave(s) left.`);
    }
    else if (availableBalance - consumedLeaves < days) {
      const displayType = leave_type.charAt(0).toUpperCase() + leave_type.slice(1);
      throw new Error(`Insufficient balance. You only have ${availableBalance - consumedLeaves} ${displayType} Leave(s) left. Cancel other pending requests.`);
    }
  }

  let initialStatus = STATUS.PENDING_MANAGER;
  
  // Admin: final approval immediately
  if (employee.role === 'admin') {
    initialStatus = STATUS.APPROVED;
  }
  // Manager/HR without a manager: skip manager step -> go to HR approval
  else if ((employee.role === 'manager' || employee.role === 'hr') && !employee.manager_id) {
    initialStatus = STATUS.PENDING_HR;
  }
  // Sick leave validation still applies, but final approval is only after HR.
  else if (leave_type === 'sick') {
    // 1. Date validation: must start today or tomorrow
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const requestStart = new Date(start_date);
    requestStart.setHours(0, 0, 0, 0);
    
    const diffTime = requestStart.getTime() - today.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0 || diffDays > 1) {
      throw new Error("Sick leaves can only be applied for starting today or tomorrow.");
    }

    // Sick leave does not need manager action; it goes directly to HR.
    initialStatus = STATUS.PENDING_HR;
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

  if (employee.manager_id) {
    const shouldNotify = 
      initialStatus === STATUS.PENDING_MANAGER ||
      // For sick leaves, we still send a notice to manager (even though HR finalizes).
      (initialStatus === STATUS.PENDING_HR && leave_type === 'sick');
      
    if (shouldNotify) {
      const { data: manager } = await supabase
        .from("users")
        .select("email")
        .eq("id", employee.manager_id)
        .single();
        
      if (manager?.email) {
        sendLeaveApplicationEmail(manager.email, employee.name, data).catch(console.error);
      }
    }
  }

  return data;
};

export const cancelLeave = async (leaveId, userId) => {
  const { data: existing, error: fetchError } = await supabase
    .from("leave_requests")
    .select("id, status, user_id")
    .eq("id", leaveId)
    .single(); 

  if (fetchError || !existing) throw new Error("Leave request not found");
  if (existing.user_id !== userId) throw new Error("Forbidden");
  if (existing.status !== STATUS.PENDING_MANAGER) throw new Error("Only leaves pending manager approval can be cancelled");

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
  const { data: leaves, error: leavesError } = await supabase
    .from("leave_requests")
    .select("*")
    .eq("manager_id", managerId)
    .order("applied_at", { ascending: false });

  if (leavesError) throw leavesError;
  if (!leaves || leaves.length === 0) return [];

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

  const { data: existing, error: fetchError } = await supabase
    .from("leave_requests")
    .select("id, status, manager_id, user_id, leave_type, start_date, end_date, days, reason, comments")
    .eq("id", leaveId)
    .single();

  if (fetchError || !existing) throw new Error("Leave request not found");
  if (existing.manager_id !== managerId) throw new Error("Forbidden");
  if (existing.status !== STATUS.PENDING_MANAGER) throw new Error("Leave already reviewed");

  const nextStatus = status === STATUS.APPROVED ? STATUS.PENDING_HR : STATUS.REJECTED;

  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      status: nextStatus,
      comments,
      reviewed_by: managerId,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", leaveId)
    .select()
    .single();

  if (error) throw error;

  // Notify employee only on final rejection at manager stage.
  if (nextStatus === STATUS.REJECTED) {
    const { data: empUser } = await supabase.from("users").select("email").eq("id", existing.user_id).single();
    const { data: managerUser } = await supabase.from("users").select("name").eq("id", managerId).single();

    if (empUser?.email && managerUser?.name) {
      const leaveDetails = { ...existing, comments: comments };
      sendLeaveApprovalEmail(empUser.email, managerUser.name, STATUS.REJECTED, leaveDetails).catch(console.error);
    }
  }

  return data;
};

export const getHrLeaves = async () => {
  const { data, error } = await supabase
    .from("leave_requests")
    .select("*, users(name, email, employee_id)")
    .eq("status", STATUS.PENDING_HR)
    .order("applied_at", { ascending: false });

  if (error) throw error;
  return data;
};

export const hrReviewLeave = async ({ leaveId, status, comments }) => {
  const { data: existing, error: fetchError } = await supabase
    .from("leave_requests")
    .select("id, status, user_id, leave_type, start_date, end_date, days, reason, comments, reviewed_by, reviewed_at")
    .eq("id", leaveId)
    .single();

  if (fetchError || !existing) throw new Error("Leave request not found");
  if (existing.status !== STATUS.PENDING_HR) throw new Error("Leave is not pending HR approval");

  const finalStatus = status === STATUS.APPROVED ? STATUS.APPROVED : STATUS.REJECTED;
  const mergedComments = (() => {
    const hrLine = comments ? `HR: ${comments}` : null;
    if (!existing.comments && !hrLine) return null;
    if (!existing.comments) return hrLine;
    if (!hrLine) return existing.comments;
    return `${existing.comments}\n${hrLine}`;
  })();

  const { data, error } = await supabase
    .from("leave_requests")
    .update({
      status: finalStatus,
      comments: mergedComments,
    })
    .eq("id", leaveId)
    .select()
    .single();

  if (error) throw error;

  // HR decision is the final decision. Notify employee.
  const { data: empUser } = await supabase.from("users").select("email").eq("id", existing.user_id).single();
  let managerName = "HR";
  if (existing.reviewed_by) {
    const { data: managerUser } = await supabase.from("users").select("name").eq("id", existing.reviewed_by).single();
    if (managerUser?.name) managerName = managerUser.name;
  }

  if (empUser?.email) {
    const leaveDetails = { ...existing, comments: mergedComments };
    sendLeaveApprovalEmail(empUser.email, managerName, finalStatus, leaveDetails).catch(console.error);
  }

  return data;
};