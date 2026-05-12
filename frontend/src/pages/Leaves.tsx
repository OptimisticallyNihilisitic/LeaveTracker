import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyLeaves, cancelLeave } from "../api/leave";
import Pagination from "../components/Pagination";

const SearchInput = ({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder: string }) => (
  <div className="relative">
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
    </svg>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="pl-9 pr-4 py-2 w-full sm:w-60 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
    />
    {value && (
      <button onClick={() => onChange("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    )}
  </div>
);

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

const matchLeave = (l: any, q: string, formatDate: (d: string) => string) => {
  const lower = q.toLowerCase();
  return (
    l.leave_type?.toLowerCase().includes(lower) ||
    (l.reason ?? "").toLowerCase().includes(lower) ||
    l.status?.toLowerCase().includes(lower) ||
    (l.status === "pending_manager" && "pending manager".includes(lower)) ||
    (l.status === "pending_hr" && "pending hr".includes(lower)) ||
    String(l.days).includes(lower) ||
    formatDate(l.start_date).toLowerCase().includes(lower) ||
    formatDate(l.end_date).toLowerCase().includes(lower) ||
    formatDate(l.applied_at).toLowerCase().includes(lower)
  );
};

export default function Leaves() {
  const { token } = useAuth();
  const [leaves, setLeaves] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<string | null>(null);

  const [pendingPage, setPendingPage] = useState(1);
  const [historyPage, setHistoryPage] = useState(1);
  const [pendingPageSize, setPendingPageSize] = useState(5);
  const [historyPageSize, setHistoryPageSize] = useState(5);
  const [pendingSearch, setPendingSearch] = useState("");
  const [historySearch, setHistorySearch] = useState("");

  const fetchLeaves = () => {
    if (!token) return;
    setLoading(true);
    getMyLeaves(token)
      .then((res: any) => {
        setLeaves(res);
        setPendingPage(1);
        setHistoryPage(1);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
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

  const formatDate = (d: string) => new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

  const pending = leaves.filter((l) => l.status === "pending_manager" || l.status === "pending_hr");
  const history = leaves.filter((l) => l.status !== "pending_manager" && l.status !== "pending_hr");

  const filteredPending = pendingSearch ? pending.filter((l) => matchLeave(l, pendingSearch, formatDate)) : pending;
  const filteredHistory = historySearch ? history.filter((l) => matchLeave(l, historySearch, formatDate)) : history;

  const pendingTotalPages = Math.max(1, Math.ceil(filteredPending.length / pendingPageSize));
  const historyTotalPages = Math.max(1, Math.ceil(filteredHistory.length / historyPageSize));

  const pendingPaged = filteredPending.slice((pendingPage - 1) * pendingPageSize, pendingPage * pendingPageSize);
  const historyPaged = filteredHistory.slice((historyPage - 1) * historyPageSize, historyPage * historyPageSize);

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

      {/* Pending Approvals */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h3 className="font-bold text-slate-800">Pending Approvals</h3>
          <SearchInput
            value={pendingSearch}
            onChange={(v) => { setPendingSearch(v); setPendingPage(1); }}
            placeholder="Search leave type, reason..."
          />
        </div>
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
              ) : filteredPending.length === 0 ? (
                <tr><td colSpan={7} className="px-5 py-8 text-center text-slate-400">
                  {pendingSearch ? "No results match your search" : "No pending requests"}
                </td></tr>
              ) : pendingPaged.map((l) => (
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
        <Pagination
          currentPage={pendingPage}
          totalPages={pendingTotalPages}
          totalItems={filteredPending.length}
          pageSize={pendingPageSize}
          onPageChange={setPendingPage}
          onPageSizeChange={(size) => { setPendingPageSize(size); setPendingPage(1); }}
        />
      </div>

      {/* Leave History */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <h3 className="font-bold text-slate-800">Leave History</h3>
          <SearchInput
            value={historySearch}
            onChange={(v) => { setHistorySearch(v); setHistoryPage(1); }}
            placeholder="Search leave type, status..."
          />
        </div>
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
              {filteredHistory.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                  {historySearch ? "No results match your search" : "No leave history"}
                </td></tr>
              ) : historyPaged.map((l) => (
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
        <Pagination
          currentPage={historyPage}
          totalPages={historyTotalPages}
          totalItems={filteredHistory.length}
          pageSize={historyPageSize}
          onPageChange={setHistoryPage}
          onPageSizeChange={(size) => { setHistoryPageSize(size); setHistoryPage(1); }}
        />
      </div>
    </div>
  );
}