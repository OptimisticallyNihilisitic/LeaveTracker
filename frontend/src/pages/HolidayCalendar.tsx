import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getHolidays } from "../api/admin";
import type { Holiday } from "../types";

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "long" });

const HolidayTable = ({ data, color, loading }: { data: Holiday[]; color: "emerald" | "blue"; loading: boolean }) => (
  <div className="overflow-x-auto">
    <table className="w-full text-sm">
      <thead>
        <tr className={`bg-${color}-50/50 border-b border-${color}-100`}>
          <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-${color}-600`}>Date / Day</th>
          <th className={`text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-${color}-600`}>Holiday</th>
        </tr>
      </thead>
      <tbody className={`divide-y divide-${color}-50`}>
        {loading ? (
          <tr><td colSpan={2} className="px-5 py-8 text-center text-slate-400">Loading...</td></tr>
        ) : data.length === 0 ? (
          <tr><td colSpan={2} className="px-5 py-8 text-center text-slate-400">No holidays found.</td></tr>
        ) : data.map((h) => (
          <tr key={h.id} className={`hover:bg-${color}-50/40 transition-colors`}>
            <td className="px-5 py-3.5 text-slate-500 text-xs">{formatDate(h.date)}</td>
            <td className="px-5 py-3.5 font-semibold text-slate-700">{h.name}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function HolidayCalendar() {
  const { token } = useAuth();
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    getHolidays(token).then(setHolidays).catch(console.error).finally(() => setLoading(false));
  }, [token]);

  
  const mandatory = holidays.filter((h) => !h.is_floater);
  const floater = holidays.filter((h) => h.is_floater);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-emerald-50 border-b border-emerald-100 px-6 py-4">
          <h3 className="font-bold text-emerald-800">Holidays</h3>
          <p className="text-xs text-emerald-600 mt-0.5">National & Festival holidays</p>
        </div>
        <HolidayTable data={mandatory} color="emerald" loading={loading} />
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="bg-blue-50 border-b border-blue-100 px-6 py-4">
          <h3 className="font-bold text-blue-800">Floater Leaves</h3>
          <p className="text-xs text-blue-600 mt-0.5">Choose any from the list below</p>
        </div>
        <HolidayTable data={floater} color="blue" loading={loading} />
      </div>
    </div>
  );
}