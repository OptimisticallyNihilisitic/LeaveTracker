import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getMyAttendance } from "../api/attendance";

const StatCard = ({ label, value, color }: { label: string; value: number | string; color: string }) => (
  <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
    <p className="text-sm font-semibold text-slate-500">{label}</p>
    <p className={`text-3xl font-bold mt-1 ${color}`}>{value}</p>
  </div>
);

export default function Attendance() {
  const { token } = useAuth();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getMyAttendance(token)
      .then(setLogs)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  const counts = {
    present: logs.filter((l) => l.status === "present").length,
    absent: logs.filter((l) => l.status === "absent").length,
    leave: logs.filter((l) => l.status === "leave").length,
  };

  const formatTime = (ts: string | null) => {
    if (!ts) return "—";
    return new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Days Present" value={counts.present} color="text-emerald-600" />
        <StatCard label="Days Absent" value={counts.absent} color="text-rose-500" />
        <StatCard label="On Leave" value={counts.leave} color="text-blue-500" />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
        <h3 className="font-bold text-slate-800 mb-5">Attendance Log</h3>
        {loading ? (
          <p className="text-sm text-slate-400">Loading...</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Date", "Status", "Check In", "Check Out", "Regularization"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {logs.length === 0 ? (
                  <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-400">No attendance records found.</td></tr>
                ) : logs.map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 font-semibold text-slate-700">{row.date}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${
                        row.status === "present" ? "bg-emerald-100 text-emerald-700"
                        : row.status === "absent" ? "bg-rose-100 text-rose-600"
                        : row.status === "leave" ? "bg-blue-100 text-blue-700"
                        : "bg-slate-100 text-slate-600"
                      }`}>{row.status}</span>
                    </td>
                    <td className="px-5 py-4 text-slate-600">{formatTime(row.check_in)}</td>
                    <td className="px-5 py-4 text-slate-600">{formatTime(row.check_out)}</td>
                    <td className="px-5 py-4">
                      {row.regularization_requested ? (
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          row.regularization_status === "approved" ? "bg-emerald-100 text-emerald-700"
                          : row.regularization_status === "rejected" ? "bg-rose-100 text-rose-600"
                          : "bg-amber-100 text-amber-700"
                        }`}>{row.regularization_status}</span>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}