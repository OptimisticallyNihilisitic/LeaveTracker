import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyLeaves, cancelLeave } from "../api/leave";

const StatusBadge = ({ status }: { status: string }) => {
  const styles: Record<string, string> = {
    pending_manager: "bg-amber-100 text-amber-700",
    pending_hr: "bg-fuchsia-100 text-fuchsia-700",
    approved: "bg-emerald-100 text-emerald-700",
    rejected: "bg-rose-100 text-rose-600",
  };
  const label =
    status === "pending_manager" ? "Pending (Manager)" :
    status === "pending_hr" ? "Pending (HR)" :
    status;
  return (
    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${styles[status] ?? "bg-slate-100 text-slate-500"}`}>
      {label}
    </span>
  );
};

export default function Leaves() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const fetchLeaves = () => {
    if (!token) return;
    setLoading(true);
    getMyLeaves(token).then((res: any) => setLeaves(res)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeaves(); }, [token]);

  const handleCancel = async (id: string) => {
    setCancelling(id);
    try {
      await cancelLeave(token!, id);
      fetchLeaves();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancelling(null);
    }
  };

  const pending = leaves.filter((l) => l.status === "pending_manager" || l.status === "pending_hr");
  const history = leaves.filter((l) => l.status !== "pending_manager" && l.status !== "pending_hr");

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="space-y-6">

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">My Leaves</h2>
          <p className="text-sm text-slate-500 mt-0.5">View and manage your leave requests</p>
        </div>
        <button
          onClick={fetchLeaves}
          disabled={loading}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl transition-colors bg-white hover:bg-slate-50 disabled:opacity-50 shadow-sm"
        >
          <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-5">Pending Approvals</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Leave Type", "Date", "Days", "Reason", "Applied On", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : pending.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">No pending requests</td></tr>
              ) : pending.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-700 capitalize">{l.leave_type}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(l.start_date)} – {formatDate(l.end_date)}</td>
                  <td className="px-5 py-4 text-slate-600">{l.days}</td>
                  <td className="px-5 py-4 text-slate-600">{l.reason ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(l.applied_at)}</td>
                  <td className="px-5 py-4"><StatusBadge status={l.status} /></td>
                  <td className="px-5 py-4">
                    {(l.status === "pending_manager" || l.status === "pending_hr") ? (
                      <button onClick={() => handleCancel(l.id)} disabled={cancelling === l.id}
                        className="text-xs font-semibold text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                        {cancelling === l.id ? "..." : "Withdraw"}
                      </button>
                    ) : (
                      <span className="text-xs text-slate-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>


      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-5">Leave History</h3>
        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Leave Type", "Date", "Days", "Reason", "Applied On", "Status"].map((h) => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {history.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">No leave history</td></tr>
              ) : history.map((l) => (
                <tr key={l.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 font-semibold text-slate-700 capitalize">{l.leave_type}</td>
                  <td className="px-5 py-4 text-slate-600">{formatDate(l.start_date)} – {formatDate(l.end_date)}</td>
                  <td className="px-5 py-4 text-slate-600">{l.days}</td>
                  <td className="px-5 py-4 text-slate-600">{l.reason ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-500">{formatDate(l.applied_at)}</td>
                  <td className="px-5 py-4"><StatusBadge status={l.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}