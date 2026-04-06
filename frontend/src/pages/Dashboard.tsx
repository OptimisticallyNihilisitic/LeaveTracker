import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyLeaves } from "../api/leave";
import type { LeaveRequest } from "../types";

const StatCard = ({ title, value, subtitle, highlight }: {
  title: string; value: string | number; subtitle: string; highlight?: boolean;
}) => (
  <div className={`rounded-2xl border p-5 flex flex-col gap-1 ${highlight ? "bg-rose-50 border-rose-200" : "bg-white border-slate-200 shadow-sm"}`}>
    <p className={`text-sm font-semibold ${highlight ? "text-rose-500" : "text-slate-500"}`}>{title}</p>
    <p className={`text-3xl font-bold ${highlight ? "text-rose-600" : "text-slate-800"}`}>{value}</p>
    <p className={`text-xs ${highlight ? "text-rose-400" : "text-slate-400"}`}>{subtitle}</p>
  </div>
);

export default function Dashboard() {
  const { user, token } = useAuth();
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getMyLeaves(token)
      .then((data) => setLeaves(data as LeaveRequest[]))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const pendingLeaves = leaves.filter((l) => l.status === "pending");
  const takenThisMonth = leaves.filter((l) => {
    const d = new Date(l.start_date);
    const now = new Date();
    return l.status === "approved"
      && d.getMonth() === now.getMonth()
      && d.getFullYear() === now.getFullYear();
  });

  const takenThisMonthDays = takenThisMonth.reduce((acc, l) => acc + (l.days ?? 0), 0);

  const consumedCasual = leaves
    .filter((l) => l.status === "approved" && l.leave_type === "casual")
    .reduce((acc, l) => acc + (l.days ?? 0), 0);

  const consumedSick = leaves
    .filter((l) => l.status === "approved" && l.leave_type === "sick")
    .reduce((acc, l) => acc + (l.days ?? 0), 0);

  const consumedFloater = leaves
    .filter((l) => l.status === "approved" && l.leave_type === "floater")
    .reduce((acc, l) => acc + (l.days ?? 0), 0);

  const totalMax = (user?.casual_leaves ?? 0) + (user?.sick_leaves ?? 0) + (user?.floater_leaves ?? 0);
  const totalConsumed = consumedCasual + consumedSick + consumedFloater;
  const totalBalance = totalMax - totalConsumed;

  const leaveBalances = [
    {
      label: "Casual Leave",
      value: Math.max(0, (user?.casual_leaves ?? 0) - consumedCasual),
      max: user?.casual_leaves ?? 0,
      color: "bg-emerald-500",
    },
    {
      label: "Sick Leave",
      value: Math.max(0, (user?.sick_leaves ?? 0) - consumedSick),
      max: user?.sick_leaves ?? 0,
      color: "bg-rose-500",
    },
    {
      label: "Floater Leave",
      value: Math.max(0, (user?.floater_leaves ?? 0) - consumedFloater),
      max: user?.floater_leaves ?? 0,
      color: "bg-amber-500",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Leaves taken" value={takenThisMonthDays} subtitle="this month" />
        <StatCard title="Leave balance" value={totalBalance} subtitle="total remaining" />
        <StatCard
          title="Pending requests"
          value={pendingLeaves.length}
          subtitle="awaiting approval"
          highlight={pendingLeaves.length > 0}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-5">Leave Balance Breakdown</h3>
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : (
            <div className="space-y-4">
              {leaveBalances.map((leave) => (
                <div key={leave.label}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-sm font-medium text-slate-600">{leave.label}</span>
                    <span className="text-xs font-semibold text-slate-500">
                      {leave.value}/{leave.max}
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className={`${leave.color} h-2.5 rounded-full transition-all`}
                      style={{ width: leave.max > 0 ? `${(leave.value / leave.max) * 100}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

    
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <h3 className="font-bold text-slate-800 mb-5">Pending Approvals</h3>
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : pendingLeaves.length === 0 ? (
            <p className="text-sm text-slate-400">No pending leave requests.</p>
          ) : (
            <div className="overflow-hidden rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Type", "Date", "Reason"].map((h) => (
                      <th key={h} className="text-left px-4 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {pendingLeaves.map((l) => (
                    <tr key={l.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 font-medium text-slate-700 capitalize">{l.leave_type}</td>
                      <td className="px-4 py-3 text-slate-600">{l.start_date} – {l.end_date}</td>
                      <td className="px-4 py-3 text-slate-500">{l.reason ?? "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}