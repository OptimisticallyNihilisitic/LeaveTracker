import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getAllUsers, assignManager, updateUser } from "../../api/admin";
import Pagination from "../../components/Pagination";

interface UserRecord {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  role: "employee" | "manager" | "hr" | "admin";
  manager_id: string | null;
}

const ROLE_STYLES: Record<string, string> = {
  employee: "bg-emerald-100 text-emerald-700",
  manager:  "bg-blue-100 text-blue-700",
  hr:       "bg-fuchsia-100 text-fuchsia-700",
  admin:    "bg-violet-100 text-violet-700",
};

export default function AdminHierarchy() {
  const { token } = useAuth();

  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const [users, setUsers]           = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [hierarchyChanges, setHierarchyChanges] = useState<Record<string, string | null>>({});
  const [roleChanges, setRoleChanges]           = useState<Record<string, string>>({});
  const [savingHierarchy, setSavingHierarchy]   = useState(false);

  const [hierarchyPage, setHierarchyPage]         = useState(1);
  const [hierarchyPageSize, setHierarchyPageSize] = useState(5);
  const [hierarchySearch, setHierarchySearch]     = useState("");

  const fetchUsers = async () => {
    if (!token) return;
    setUsersLoading(true);
    try {
      const data = await getAllUsers(token);
      setUsers(data);
      setHierarchyPage(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, [token]);

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  const handleSaveHierarchy = async () => {
    setSavingHierarchy(true);
    try {
      const managerPromises = Object.entries(hierarchyChanges).map(([userId, managerId]) =>
        assignManager(token!, userId, managerId)
      );
      const rolePromises = Object.entries(roleChanges).map(([userId, role]) =>
        updateUser(token!, userId, { role })
      );
      await Promise.all([...managerPromises, ...rolePromises]);
      setHierarchyChanges({});
      setRoleChanges({});
      notify("Hierarchy and roles updated successfully.");
      fetchUsers();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setSavingHierarchy(false);
    }
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return "—";
    return users.find(u => u.id === managerId)?.name ?? "—";
  };

  const matchQ = (q: string, ...fields: (string | number | null | undefined)[]) =>
    fields.some(f => String(f ?? "").toLowerCase().includes(q.toLowerCase()));

  const filteredHierarchy = hierarchySearch
    ? users.filter(u => matchQ(hierarchySearch, u.name, u.employee_id, u.role, getManagerName(u.manager_id)))
    : users;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Reporting Hierarchy</h2>
          <p className="text-sm text-slate-500 mt-0.5">Set who each user reports to and manage roles</p>
        </div>
        <button
          onClick={fetchUsers}
          disabled={usersLoading}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl transition-colors bg-white hover:bg-slate-50 disabled:opacity-50 shadow-sm"
        >
          <svg className={`w-4 h-4 ${usersLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {usersLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">{error}</div>}
      {success && <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">{success}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Reporting Hierarchy</h3>
            <p className="text-sm text-slate-500 mt-0.5">Set who each user reports to. Changes are batched — click Save when done.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
              <input type="text" value={hierarchySearch} onChange={e => { setHierarchySearch(e.target.value); setHierarchyPage(1); }} placeholder="Search by name, role..." className="pl-9 pr-4 py-2 w-48 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" />
            </div>
            {(Object.keys(hierarchyChanges).length > 0 || Object.keys(roleChanges).length > 0) && (
              <button onClick={handleSaveHierarchy} disabled={savingHierarchy}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm text-sm whitespace-nowrap">
                {savingHierarchy ? "Saving..." : "Save changes"}
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Employee", "Role", "Currently Reports To", "Change To"].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersLoading ? (
                <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : filteredHierarchy.slice((hierarchyPage - 1) * hierarchyPageSize, hierarchyPage * hierarchyPageSize).map(u => {
                const currentManagerId = hierarchyChanges.hasOwnProperty(u.id) ? hierarchyChanges[u.id] : u.manager_id;
                const currentRole      = roleChanges.hasOwnProperty(u.id)      ? roleChanges[u.id]      : u.role;
                const isDirty          = hierarchyChanges.hasOwnProperty(u.id) || roleChanges.hasOwnProperty(u.id);

                return (
                  <tr key={u.id} className={`transition-colors ${isDirty ? "bg-amber-50" : "hover:bg-slate-50"}`}>
                    <td className="px-5 py-4">
                      <p className="font-semibold text-slate-800">{u.name}</p>
                      <p className="text-xs text-slate-400 font-mono">{u.employee_id}</p>
                    </td>
                    <td className="px-5 py-4">
                      <select
                        value={currentRole}
                        onChange={e => {
                          const val = e.target.value;
                          if (val === u.role) {
                            setRoleChanges(prev => { const next = { ...prev }; delete next[u.id]; return next; });
                          } else {
                            setRoleChanges(prev => ({ ...prev, [u.id]: val }));
                          }
                        }}
                        className={`px-3 py-1 border border-slate-200 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer appearance-none ${ROLE_STYLES[currentRole]}`}>
                        <option value="employee" className="bg-white text-slate-800">EMPLOYEE</option>
                        <option value="manager"  className="bg-white text-slate-800">MANAGER</option>
                        <option value="hr"       className="bg-white text-slate-800">HR</option>
                        <option value="admin"    className="bg-white text-slate-800">ADMIN</option>
                      </select>
                    </td>
                    <td className="px-5 py-4 text-slate-500">{getManagerName(u.manager_id)}</td>
                    <td className="px-5 py-4">
                      <select
                        value={currentManagerId ?? ""}
                        onChange={e => {
                          const val = e.target.value || null;
                          if (val === u.manager_id) {
                            setHierarchyChanges(prev => { const next = { ...prev }; delete next[u.id]; return next; });
                          } else {
                            setHierarchyChanges(prev => ({ ...prev, [u.id]: val }));
                          }
                        }}
                        className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white appearance-none">
                        <option value="">No manager</option>
                        {users
                          .filter(m => m.id !== u.id && (m.role === "manager" || m.role === "hr" || m.role === "admin"))
                          .map(m => (
                            <option key={m.id} value={m.id}>{m.name} ({m.role})</option>
                          ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={hierarchyPage}
          totalPages={Math.max(1, Math.ceil(filteredHierarchy.length / hierarchyPageSize))}
          totalItems={filteredHierarchy.length}
          pageSize={hierarchyPageSize}
          onPageChange={setHierarchyPage}
          onPageSizeChange={size => { setHierarchyPageSize(size); setHierarchyPage(1); }}
        />
      </div>
    </div>
  );
}
