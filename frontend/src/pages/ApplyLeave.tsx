import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useAppDispatch, useAppSelector } from "../store/hooks";
import { fetchMyLeaves, selectMyLeaves, invalidateLeaves } from "../store/leavesSlice";
import { fetchHolidays, selectHolidays } from "../store/holidaysSlice";
import { fetchCurrentPolicy, selectCurrentPolicy } from "../store/policySlice";
import { applyLeave } from "../api/leave";

export default function ApplyLeave() {
  const { user, token } = useAuth();
  const dispatch = useAppDispatch();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  
  const policy = useAppSelector(selectCurrentPolicy);
  const leaves = useAppSelector(selectMyLeaves);
  const holidays = useAppSelector(selectHolidays);
  
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (token) {
      dispatch(fetchCurrentPolicy({ token }));
      dispatch(fetchMyLeaves({ token }));
      dispatch(fetchHolidays({ token }));
    }
  }, [token, dispatch]);
 
  // Calculate leaves left dynamically
  const consumedCasual = leaves
    .filter((l) => l.status === "approved" && l.leave_type === "casual")
    .reduce((acc, l) => acc + (l.days ?? 0), 0);
  const consumedSick = leaves
    .filter((l) => l.status === "approved" && l.leave_type === "sick")
    .reduce((acc, l) => acc + (l.days ?? 0), 0);
  const consumedFloater = leaves
    .filter((l) => l.status === "approved" && l.leave_type === "floater")
    .reduce((acc, l) => acc + (l.days ?? 0), 0);

  const casualLeft = Math.max(0, (user?.casual_leaves ?? 0) - consumedCasual);
  const sickLeft = Math.max(0, (user?.sick_leaves ?? 0) - consumedSick);
  const floaterLeft = Math.max(0, (user?.floater_leaves ?? 0) - consumedFloater);

  const leaveBalances = [
    { label: "Casual Leave",  value: casualLeft,  max: user?.casual_leaves ?? 0, color: "bg-emerald-500" },
    { label: "Sick Leave",    value: sickLeft,    max: user?.sick_leaves ?? 0,   color: "bg-rose-500" },
    { label: "Floater Leave", value: floaterLeft, max: user?.floater_leaves ?? 0, color: "bg-amber-500" },
  ];

  // Calculate working days & validate floaters
  let numDays = 0;
  let invalidFloaterFound = false;
  let hasOverlap = false;

  if (from && to) {
    const start = new Date(from);
    const end = new Date(to);

    // Filter active leaves for overlap checking
    const activeLeaves = leaves.filter(
      (l) => l.status === "approved" || l.status === "pending_manager" || l.status === "pending_hr"
    );

    if (start <= end) {
      // Check for overlapping existing active leaves
      hasOverlap = activeLeaves.some(l => {
        const ls = new Date(l.start_date);
        const le = new Date(l.end_date);
        return start <= le && end >= ls;
      });

      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const dayOfWeek = d.getDay();
        
        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) continue;

        // Skip mandatory holidays
        const isMandatory = holidays.some(
          (h) => !h.is_floater && new Date(h.date).toDateString() === d.toDateString()
        );
        if (isMandatory) continue;

        // Valid leave day
        numDays++;

        // Floater validation
        if (leaveType === "floater") {
          const isFloater = holidays.some(
            (h) => h.is_floater && new Date(h.date).toDateString() === d.toDateString()
          );
          if (!isFloater) invalidFloaterFound = true;
        }
      }
    }
  }

  const handleSubmit = async () => {
    if (!from || !to || !leaveType) {
      setError("Please fill in all required fields."); return;
    }
    if (new Date(from) > new Date(to)) {
      setError("Start date cannot be after end date."); return;
    }
    if (hasOverlap) {
      setError("You already have an active leave request during the selected dates."); return;
    }
    if (numDays === 0) {
      setError("Selected range contains 0 working days."); return;
    }
    if (leaveType === "floater" && invalidFloaterFound) {
      setError("One or more selected days are not designated floater holidays."); return;
    }

    if (leaveType === "sick") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const requestStart = new Date(from);
      requestStart.setHours(0, 0, 0, 0);
      
      const diffTime = requestStart.getTime() - today.getTime();
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0 || diffDays > 1) {
        setError("Sick leaves can only be applied for starting today or tomorrow."); return;
      }
    }

    if (leaveType === "casual" && numDays > casualLeft) {
      setError(`Insufficient balance. You only have ${casualLeft} Casual Leave(s) left.`); return;
    }
    if (leaveType === "sick" && numDays > sickLeft) {
      setError(`Insufficient balance. You only have ${sickLeft} Sick Leave(s) left.`); return;
    }
    if (leaveType === "floater" && numDays > floaterLeft) {
      setError(`Insufficient balance. You only have ${floaterLeft} Floater Leave(s) left.`); return;
    }

    setError(""); setLoading(true);
    try {
      await applyLeave(token!, {
        leave_type: leaveType,
        start_date: from,
        end_date: to,
        days: numDays,
        reason,
      });
      
      const isAutoApproved = user?.role === "admin" && !user?.manager_id;
      if (isAutoApproved) {
        setSuccessMsg("Leave request auto-approved successfully and recorded to your balance!");
      } else {
        setSuccessMsg("Leave request submitted successfully! Your manager or HR/Admin will be notified.");
      }
      
      setFrom(""); setTo(""); setLeaveType(""); setReason("");
      
      // Optionally refresh leaves data to update balances immediately
      dispatch(invalidateLeaves());
      dispatch(fetchMyLeaves({ token: token!, force: true }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-6">Leave Request Form</h2>

        {successMsg && (
          <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
            {successMsg}
          </div>
        )}
        {error && (
          <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">From</label>
              <input type="date" value={from}
                onChange={(e) => { setFrom(e.target.value); setSuccessMsg(""); }}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">To</label>
              <input type="date" value={to}
                onChange={(e) => { setTo(e.target.value); setSuccessMsg(""); }}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">No. of days</label>
            <div className={`w-full px-4 py-3 border rounded-xl text-sm ${invalidFloaterFound && leaveType === 'floater' ? 'border-amber-300 bg-amber-50 text-amber-700' : 'border-slate-200 bg-slate-50 text-slate-500'}`}>
              {numDays > 0 ? `${numDays} working day${numDays > 1 ? "s" : ""}` : "0 working days"}
              {invalidFloaterFound && leaveType === 'floater' && " (Invalid floater dates selected)"}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Leave Type</label>
            <select value={leaveType} onChange={(e) => setLeaveType(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-slate-50 appearance-none">
              <option value="">Select leave type</option>
              <option value="casual">Casual Leave</option>
              <option value="sick">Sick Leave</option>
              <option value="floater">Floater Leave</option>
              <option value="loss_of_pay">Loss of Pay (Unpaid Leave)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason</label>
            <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4}
              placeholder="Enter reason for leave..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-slate-50 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm">
              {loading ? "Submitting..." : "Submit"}
            </button>
            <button onClick={() => { setFrom(""); setTo(""); setLeaveType(""); setReason(""); setError(""); setSuccessMsg(""); }}
              className="flex-1 bg-white hover:bg-rose-50 text-rose-500 font-semibold py-3 rounded-xl border border-rose-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>

 
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-5">Leave Balance Breakdown</h3>
        <div className="space-y-4">
          {leaveBalances.map((leave) => (
            <div key={leave.label}>
              <div className="flex justify-between items-center mb-1.5">
                <span className="text-sm font-medium text-slate-600">{leave.label}</span>
                <span className="text-xs font-bold text-slate-500">{leave.value}/{leave.max}</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2.5">
                <div className={`${leave.color} h-2.5 rounded-full transition-all`}
                  style={{ width: leave.max > 0 ? `${(leave.value / leave.max) * 100}%` : "0%" }} />
              </div>
            </div>
          ))}
        </div>
        {!policy && (
          <p className="text-xs text-slate-400 mt-4">No policy configured for this year. Contact your admin.</p>
        )}
      </div>
    </div>
  );
}