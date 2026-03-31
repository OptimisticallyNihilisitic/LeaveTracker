import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { applyLeave } from "../api/leave";

export default function ApplyLeave() {
  const { user, token } = useAuth();
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const numDays = from && to
    ? Math.max(0, Math.ceil((new Date(to).getTime() - new Date(from).getTime()) / (1000 * 60 * 60 * 24)) + 1)
    : 0;

  const leaveBalances = [
    { label: "Casual Leave", value: user?.casual_leaves ?? 0, max: 12, color: "bg-emerald-500" },
    { label: "Sick Leave", value: user?.sick_leaves ?? 0, max: 12, color: "bg-rose-500" },
    { label: "Floater Leave", value: user?.floater_leaves ?? 0, max: 12, color: "bg-amber-500" },
  ];

  const handleSubmit = async () => {
    if (!from || !to || !leaveType) {
      setError("Please fill in all required fields.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await applyLeave(token!, {
        leave_type: leaveType,
        start_date: from,
        end_date: to,
        days: numDays,
        reason,
      });
      setSuccess(true);
      setFrom(""); setTo(""); setLeaveType(""); setReason("");
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

        {success && (
          <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
            Leave request submitted successfully!
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
              <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setSuccess(false); }}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">To</label>
              <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setSuccess(false); }}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-slate-50" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">No. of days</label>
            <div className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-500 bg-slate-50">
              {numDays > 0 ? `${numDays} day${numDays > 1 ? "s" : ""}` : "0"}
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
            <button onClick={() => { setFrom(""); setTo(""); setLeaveType(""); setReason(""); setError(""); setSuccess(false); }}
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
                <div className={`${leave.color} h-2.5 rounded-full`} style={{ width: `${(leave.value / leave.max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}