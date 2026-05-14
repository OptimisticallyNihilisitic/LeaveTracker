import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPolicies, getHolidays, addHoliday, deleteHoliday } from "../../api/admin";
import Pagination from "../../components/Pagination";

export default function AdminHolidays() {
  const { token } = useAuth();

  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const [policies, setPolicies] = useState<any[]>([]);
  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayForm, setHolidayForm] = useState({ policy_id: "", name: "", date: "", is_floater: false });
  const [holidayLoading, setHolidayLoading]       = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(null);

  const [holidaysPage, setHolidaysPage]         = useState(1);
  const [holidaysPageSize, setHolidaysPageSize] = useState(5);
  const [holidaysSearch, setHolidaysSearch]     = useState("");
  const [dataLoading, setDataLoading]           = useState(true);

  const fetchData = async () => {
    if (!token) return;
    setDataLoading(true);
    try {
      const [p, h] = await Promise.all([getPolicies(token), getHolidays(token)]);
      setPolicies(p);
      setHolidays(h);
      setHolidaysPage(1);
      if (p.length > 0) {
        setHolidayForm(f => ({ ...f, policy_id: p[0].id }));
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDataLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.policy_id || !holidayForm.name || !holidayForm.date) {
      notify("Policy, name and date are required.", true); return;
    }
    setHolidayLoading(true);
    try {
      await addHoliday(token!, holidayForm);
      setHolidayForm(f => ({ ...f, name: "", date: "", is_floater: false }));
      notify("Holiday added.");
      fetchData();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setHolidayLoading(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    setDeletingHolidayId(id);
    try {
      await deleteHoliday(token!, id);
      notify("Holiday deleted.");
      fetchData();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setDeletingHolidayId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const matchQ = (q: string, ...fields: (string | number | null | undefined)[]) =>
    fields.some(f => String(f ?? "").toLowerCase().includes(q.toLowerCase()));

  const filteredHolidays = holidaysSearch
    ? holidays.filter(h => matchQ(holidaysSearch, h.name, h.date, h.policies?.year, h.is_floater ? "floater" : ""))
    : holidays;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Holidays</h2>
          <p className="text-sm text-slate-500 mt-0.5">Add or remove holidays for any policy year</p>
        </div>
        <button
          onClick={fetchData}
          disabled={dataLoading}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl transition-colors bg-white hover:bg-slate-50 disabled:opacity-50 shadow-sm"
        >
          <svg className={`w-4 h-4 ${dataLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {dataLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">{error}</div>}
      {success && <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">{success}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Holidays</h3>
            <p className="text-sm text-slate-500 mt-0.5">Add or remove holidays for any policy year.</p>
          </div>
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
            <input type="text" value={holidaysSearch} onChange={e => { setHolidaysSearch(e.target.value); setHolidaysPage(1); }} placeholder="Search holidays..." className="pl-9 pr-4 py-2 w-48 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" />
          </div>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Policy Year</label>
              <select value={holidayForm.policy_id}
                onChange={e => setHolidayForm(f => ({ ...f, policy_id: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50 appearance-none">
                <option value="">Select year</option>
                {policies.map(p => (
                  <option key={p.id} value={p.id}>{p.year}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Holiday Name</label>
              <input type="text" value={holidayForm.name} placeholder="e.g. Pongal"
                onChange={e => setHolidayForm(f => ({ ...f, name: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50" />
            </div>
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
              <input type="date" value={holidayForm.date}
                onChange={e => setHolidayForm(f => ({ ...f, date: e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={holidayForm.is_floater}
                onChange={e => setHolidayForm(f => ({ ...f, is_floater: e.target.checked }))}
                className="w-4 h-4 text-emerald-500 rounded border-slate-300 focus:ring-emerald-400" />
              <span className="text-sm font-semibold text-slate-700">This is a Restricted / Floater Holiday</span>
            </label>
            <button onClick={handleAddHoliday} disabled={holidayLoading}
              className="w-full sm:w-auto px-8 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold py-2.5 rounded-xl transition-colors shadow-sm">
              {holidayLoading ? "Adding..." : "Add Holiday"}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Year", "Holiday", "Date", ""].map((h, i) => (
                  <th key={i} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredHolidays.length === 0 ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">{holidaysSearch ? "No results match your search" : "No holidays added yet."}</td></tr>
              ) : filteredHolidays.slice((holidaysPage - 1) * holidaysPageSize, holidaysPage * holidaysPageSize).map(h => (
                <tr key={h.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5 text-slate-500">{h.policies?.year ?? "—"}</td>
                  <td className="px-5 py-3.5 font-semibold text-slate-700">
                    {h.name}
                    {h.is_floater && (
                      <span className="ml-2 inline-flex items-center text-[10px] font-bold uppercase tracking-widest bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full relative top-[-1px]">
                        Floater
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{formatDate(h.date)}</td>
                  <td className="px-5 py-3.5">
                    <button onClick={() => handleDeleteHoliday(h.id)} disabled={deletingHolidayId === h.id}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      {deletingHolidayId === h.id ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={holidaysPage}
          totalPages={Math.max(1, Math.ceil(filteredHolidays.length / holidaysPageSize))}
          totalItems={filteredHolidays.length}
          pageSize={holidaysPageSize}
          onPageChange={setHolidaysPage}
          onPageSizeChange={size => { setHolidaysPageSize(size); setHolidaysPage(1); }}
        />
      </div>
    </div>
  );
}
