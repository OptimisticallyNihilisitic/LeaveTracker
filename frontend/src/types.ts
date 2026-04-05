export interface UserProfile {
  id: string;
  employee_id: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "admin";
  manager_id: string | null;
  sick_leaves: number;
  casual_leaves: number;
  floater_leaves: number;
  created_at: string;
}

export interface Policy {
  id: string;
  year: number;
  sick_leaves: number;
  casual_leaves: number;
  floater_leaves: number;
  holidays?: Holiday[];
}

export interface Holiday {
  id: string;
  policy_id: string;
  name: string;
  date: string;
  policies?: { year: number };
}

export interface LeaveRequest {
  id: string;
  user_id: string;
  manager_id: string | null;
  leave_type: string;
  start_date: string;
  end_date: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  applied_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
  comments: string | null;
  users?: {
    name: string;
    email: string;
    employee_id: string;
  };
}

export interface AttendanceRecord {
  id: string;
  user_id: string;
  date: string;
  status: "present" | "absent" | "late" | "half-day" | "regularized";
  sign_in_time: string | null;
  sign_out_time: string | null;
  regularization_reason: string | null;
  users?: {
    name: string;
    email: string;
    employee_id: string;
  };
}
