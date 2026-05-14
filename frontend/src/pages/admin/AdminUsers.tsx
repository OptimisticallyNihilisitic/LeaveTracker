import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  createUser, deleteUser, getAllUsers,
} from "../../api/admin";
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

export default function AdminUsers() {
  const { token } = useAuth();

  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const [users, setUsers]           = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userForm, setUserForm]     = useState({
    name: "", email: "", employee_id: "", password: "",
    role: "employee" as "employee" | "manager" | "hr" | "admin",
    manager_id: "",
  });
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [showUserForm, setShowUserForm]       = useState(false);

  const [usersPage, setUsersPage]         = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(5);
  const [usersSearch, setUsersSearch]     = useState("");

  const fetchUsers = async () => {
    if (!token) return;
    setUsersLoading(true);
    try {
      const data = await getAllUsers(token);
      setUsers(data);
      setUsersPage(1);
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

  const handleCreateUser = async () => {
    const { name, email, employee_id, password, role, manager_id } = userForm;
    if (!name || !email || !employee_id || !password) {
      notify("Name, email, employee ID and password are required.", true); return;
    }
    if (!email.endsWith("@test.com")) {
      notify("Email must end with @test.com", true); return;
    }
    if (users.some(u => u.email === email)) {
      notify("A user with this email already exists", true); return;
    }
    setUserFormLoading(true);
    try {
      await createUser(token!, { name, email, employee_id, password, role, manager_id: manager_id || null });
      notify(`User ${name} created successfully.`);
      setUserForm({ name: "", email: "", employee_id: "", password: "", role: "employee", manager_id: "" });
      setShowUserForm(false);
      fetchUsers();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setUserFormLoading(false);
    }
  };

  const handleDeleteUser = async (id: string, name: string) => {
    if (!confirm(`Delete user "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    try {
      await deleteUser(token!, id);
      notify(`User ${name} deleted.`);
      fetchUsers();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setDeletingId(null);
    }
  };

  const getManagerName = (managerId: string | null) => {
    if (!managerId) return "—";
    return users.find(u => u.id === managerId)?.name ?? "—";
  };

  const managerOptions = users.filter(u => u.role === "manager" || u.role === "hr" || u.role === "admin");

  const matchQ = (q: string, ...fields: (string | number | null | undefined)[]) =>
    fields.some(f => String(f ?? "").toLowerCase().includes(q.toLowerCase()));

  const filteredUsers = usersSearch
    ? users.filter(u => matchQ(usersSearch, u.name, u.email, u.employee_id, u.role, getManagerName(u.manager_id)))
    : users;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Users</h2>
          <p className="text-sm text-slate-500 mt-0.5">Create, view and delete user accounts</p>
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
            <h3 className="font-bold text-slate-800">All Users</h3>
            <p className="text-sm text-slate-500 mt-0.5">Manage all registered users in the system</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
              <input type="text" value={usersSearch} onChange={e => { setUsersSearch(e.target.value); setUsersPage(1); }} placeholder="Search users..." className="pl-9 pr-4 py-2 w-48 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" />
            </div>
            <button onClick={() => setShowUserForm(v => !v)}
              className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm whitespace-nowrap">
              {showUserForm ? "Cancel" : "+ Add User"}
            </button>
          </div>
        </div>

        {showUserForm && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
            <h4 className="font-semibold text-slate-700">New User</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "name",        label: "Full Name",   type: "text",     placeholder: "e.g. Revathi V" },
                { key: "email",       label: "Email",       type: "email",    placeholder: "e.g. revathi@test.com" },
                { key: "employee_id", label: "Employee ID", type: "text",     placeholder: "e.g. EMP003" },
                { key: "password",    label: "Password",    type: "password", placeholder: "Min. 8 characters" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                  <input type={type} placeholder={placeholder}
                    value={userForm[key as keyof typeof userForm] as string}
                    onChange={e => setUserForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <select value={userForm.role}
                  onChange={e => setUserForm(f => ({ ...f, role: e.target.value as any }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white appearance-none">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                  <option value="admin">Admin</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reports To (optional)</label>
                <select value={userForm.manager_id}
                  onChange={e => setUserForm(f => ({ ...f, manager_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white appearance-none">
                  <option value="">No manager</option>
                  {managerOptions.map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <button onClick={handleCreateUser} disabled={userFormLoading}
              className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm">
              {userFormLoading ? "Creating..." : "Create User"}
            </button>
          </div>
        )}

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                {["Employee ID", "Name", "Email", "Role", "Reports To", ""].map((h, i) => (
                  <th key={i} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {usersLoading ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Loading...</td></tr>
              ) : filteredUsers.length === 0 ? (
                <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">{usersSearch ? "No results match your search" : "No users yet."}</td></tr>
              ) : filteredUsers.slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize).map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-slate-500 font-mono text-xs">{u.employee_id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{u.name}</td>
                  <td className="px-5 py-4 text-slate-600">{u.email}</td>
                  <td className="px-5 py-4">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${ROLE_STYLES[u.role]}`}>{u.role}</span>
                  </td>
                  <td className="px-5 py-4 text-slate-500">{getManagerName(u.manager_id)}</td>
                  <td className="px-5 py-4">
                    <button onClick={() => handleDeleteUser(u.id, u.name)} disabled={deletingId === u.id}
                      className="text-xs font-semibold text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-300 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                      {deletingId === u.id ? "..." : "Delete"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Pagination
          currentPage={usersPage}
          totalPages={Math.max(1, Math.ceil(filteredUsers.length / usersPageSize))}
          totalItems={filteredUsers.length}
          pageSize={usersPageSize}
          onPageChange={setUsersPage}
          onPageSizeChange={size => { setUsersPageSize(size); setUsersPage(1); }}
        />
      </div>
    </div>
  );
}
