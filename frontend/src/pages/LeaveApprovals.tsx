import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getTeamLeaves, reviewLeave } from "../api/leave";

type LeaveStatus = "pending" | "approved" | "rejected";

const STATUS_STYLES: Record<LeaveStatus, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-emerald-100 text-emerald-700",
  rejected: "bg-rose-100 text-rose-600",
};

const LEAVE_TYPE_DOT: Record<string, string> = {
  casual: "bg-emerald-400",
  sick: "bg-rose-400",
  floater: "bg-amber-400",
};

type FilterStatus = "all" | LeaveStatus;

export default function LeaveApprovals() {
  const { token } = useAuth();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterStatus>("all");
  const [search, setSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState<{ id: string; action: "approved" | "rejected" } | null>(null);
  const [comments, setComments] = useState("");
  const [reviewing, setReviewing] = useState(false);

  const fetchLeaves = () => {
    if (!token) return;
    getTeamLeaves(token).then((res: any) => setRequests(res)).catch(console.error).finally(() => setLoading(false));
  };

  useEffect(() => { fetchLeaves(); }, [token]);

  const handleReview = async () => {
    if (!confirmModal) return;
    setReviewing(true);
    try {
      await reviewLeave(token!, confirmModal.id, { status: confirmModal.action, comments });
      setConfirmModal(null);
      setComments("");
      fetchLeaves();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setReviewing(false);
    }
  };

  const filtered = requests.filter((r) => {
    const matchesFilter = filter === "all" || r.status === filter;
    const matchesSearch =
      r.users?.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.leave_type?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const counts = {
    all: requests.length,
    pending: requests.filter((r) => r.status === "pending").length,
    approved: requests.filter((r) => r.status === "approved").length,
    rejected: requests.filter((r) => r.status === "rejected").length,
  };

  const filterTabs: FilterStatus[] = ["all", "pending", "approved", "rejected"];
  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Leave Approvals</h2>
        <p className="text-sm text-slate-500 mt-0.5">Review and action leave requests from your team</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {(["pending", "approved", "rejected"] as LeaveStatus[]).map((s) => (
          <div key={s} onClick={() => setFilter(filter === s ? "all" : s)}
            className={`rounded-2xl border p-5 cursor-pointer transition-all ${
              filter === s
                ? s === "pending" ? "bg-amber-50 border-amber-300 shadow-sm"
                  : s === "approved" ? "bg-emerald-50 border-emerald-300 shadow-sm"
                  : "bg-rose-50 border-rose-300 shadow-sm"
                : "bg-white border-slate-200 hover:border-slate-300"
            }`}>
            <p className={`text-sm font-semibold capitalize ${s === "pending" ? "text-amber-600" : s === "approved" ? "text-emerald-600" : "text-rose-500"}`}>{s}</p>
            <p className="text-3xl font-bold text-slate-800 mt-1">{counts[s]}</p>
            <p className="text-xs text-slate-400 mt-0.5">requests</p>
          </div>
        ))}
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <p className="text-sm font-semibold text-slate-500">Total</p>
          <p className="text-3xl font-bold text-slate-800 mt-1">{counts.all}</p>
          <p className="text-xs text-slate-400 mt-0.5">all requests</p>
        </div>
      </div>

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1">
          {filterTabs.map((tab) => (
            <button key={tab} onClick={() => setFilter(tab)}
              className={`px-4 py-1.5 rounded-lg text-sm font-semibold capitalize transition-all ${filter === tab ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
              {tab}
              <span className={`ml-1.5 text-xs px-1.5 py-0.5 rounded-full ${filter === tab ? "bg-slate-100 text-slate-600" : "bg-slate-200 text-slate-500"}`}>
                {counts[tab]}
              </span>
            </button>
          ))}
        </div>
        <input type="text" placeholder="Search employee or leave type..." value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full sm:w-64 px-4 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Employee", "Leave Type", "Duration", "Days", "Reason", "Applied On", "Status", "Action"].map((h) => (
                  <th key={h} className="text-left px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-slate-500 whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400">No requests match your filter</td></tr>
              ) : filtered.map((req) => (
                <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4">
                    <p className="font-semibold text-slate-800">{req.users?.name ?? "—"}</p>
                    <p className="text-xs text-slate-400 mt-0.5">{req.users?.email ?? ""}</p>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${LEAVE_TYPE_DOT[req.leave_type] ?? "bg-slate-400"}`} />
                      <span className="text-slate-700 font-medium capitalize">{req.leave_type}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-slate-600 whitespace-nowrap">
                    {req.start_date === req.end_date ? formatDate(req.start_date) : `${formatDate(req.start_date)} – ${formatDate(req.end_date)}`}
                  </td>
                  <td className="px-5 py-4">
                    <span className="font-semibold text-slate-800">{req.days}</span>
                    <span className="text-slate-400 ml-1 text-xs">day{req.days > 1 ? "s" : ""}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-600 max-w-[160px] truncate">{req.reason ?? "—"}</td>
                  <td className="px-5 py-4 text-slate-500 whitespace-nowrap">{formatDate(req.applied_at)}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${STATUS_STYLES[req.status as LeaveStatus]}`}>{req.status}</span>
                  </td>
                  <td className="px-5 py-4">
                    {req.status === "pending" ? (
                      <div className="flex gap-2">
                        <button onClick={() => setConfirmModal({ id: req.id, action: "approved" })}
                          className="text-xs font-semibold text-emerald-600 hover:text-white bg-emerald-50 hover:bg-emerald-500 border border-emerald-200 hover:border-emerald-500 px-3 py-1.5 rounded-lg transition-all">
                          Approve
                        </button>
                        <button onClick={() => setConfirmModal({ id: req.id, action: "rejected" })}
                          className="text-xs font-semibold text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 border border-rose-200 hover:border-rose-500 px-3 py-1.5 rounded-lg transition-all">
                          Reject
                        </button>
                      </div>
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

      {/* Confirm Modal */}
      {confirmModal && (() => {
        const req = requests.find((r) => r.id === confirmModal.id);
        const isApprove = confirmModal.action === "approved";
        return (
          <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-7">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 ${isApprove ? "bg-emerald-100" : "bg-rose-100"}`}>
                {isApprove ? (
                  <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
              </div>
              <h3 className="text-lg font-bold text-slate-800">{isApprove ? "Approve leave?" : "Reject leave?"}</h3>
              <p className="text-sm text-slate-500 mt-1.5 leading-relaxed">
                {req?.users?.name}'s <span className="font-semibold text-slate-700 capitalize">{req?.leave_type}</span> leave for{" "}
                <span className="font-semibold text-slate-700">{req && (req.start_date === req.end_date ? formatDate(req.start_date) : `${formatDate(req.start_date)} – ${formatDate(req.end_date)}`)}</span>.
              </p>
              <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={3}
                placeholder="Add comments (optional)..."
                className="w-full mt-4 px-3 py-2.5 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50 resize-none" />
              <div className="flex gap-3 mt-4">
                <button onClick={handleReview} disabled={reviewing}
                  className={`flex-1 font-semibold py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60 ${isApprove ? "bg-emerald-500 hover:bg-emerald-600 text-white" : "bg-rose-500 hover:bg-rose-600 text-white"}`}>
                  {reviewing ? "..." : isApprove ? "Yes, Approve" : "Yes, Reject"}
                </button>
                <button onClick={() => { setConfirmModal(null); setComments(""); }}
                  className="flex-1 bg-white hover:bg-slate-50 text-slate-600 font-semibold py-2.5 rounded-xl border border-slate-200 transition-colors text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}