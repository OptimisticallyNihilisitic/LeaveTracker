import { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getPolicies, upsertPolicy,
  getHolidays, addHoliday, deleteHoliday,
  createUser, deleteUser, assignManager, getAllUsers, updateUser,
  getInvitations, createInvitation, cancelInvitation, resendInvitation, type InvitationRecord
} from "../api/admin";
import Pagination from "../components/Pagination";


type Tab = "users" | "invitations" | "hierarchy" | "policy" | "holidays";


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

export default function AdminPanel() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("users");

  const [error, setError]   = useState("");
  const [success, setSuccess] = useState("");

  const [users, setUsers] = useState<UserRecord[]>([]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({
    name: "", email: "", employee_id: "", password: "",
    role: "employee" as "employee" | "manager" | "hr" | "admin",
    manager_id: "",
  });
  const [userFormLoading, setUserFormLoading] = useState(false);
  const [showUserForm, setShowUserForm] = useState(false);

  const [invitations, setInvitations] = useState<InvitationRecord[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "", email: "", employee_id: "", role: "employee" as "employee" | "manager" | "hr" | "admin", manager_id: ""
  });
  const [inviteFormLoading, setInviteFormLoading] = useState(false);

  const [hierarchyChanges, setHierarchyChanges] = useState<Record<string, string | null>>({});

  const [roleChanges, setRoleChanges] = useState<Record<string, string>>({});
  const [savingHierarchy, setSavingHierarchy] = useState(false);

  const [policies, setPolicies] = useState<any[]>([]);
  const [policyForm, setPolicyForm] = useState({
    year: new Date().getFullYear(),
    sick_leaves: 0, casual_leaves: 0, floater_leaves: 0,
  });
  const [policyLoading, setPolicyLoading] = useState(false);

  const [holidays, setHolidays] = useState<any[]>([]);
  const [holidayForm, setHolidayForm] = useState({ policy_id: "", name: "", date: "", is_floater: false });
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [deletingHolidayId, setDeletingHolidayId] = useState<string | null>(null);

  // Pagination states per tab
  const [usersPage, setUsersPage] = useState(1);
  const [invitationsPage, setInvitationsPage] = useState(1);
  const [hierarchyPage, setHierarchyPage] = useState(1);
  const [holidaysPage, setHolidaysPage] = useState(1);
  const [usersPageSize, setUsersPageSize] = useState(5);
  const [invitationsPageSize, setInvitationsPageSize] = useState(5);
  const [hierarchyPageSize, setHierarchyPageSize] = useState(5);
  const [holidaysPageSize, setHolidaysPageSize] = useState(5);

  // Search states per tab
  const [usersSearch, setUsersSearch] = useState("");
  const [invitationsSearch, setInvitationsSearch] = useState("");
  const [hierarchySearch, setHierarchySearch] = useState("");
  const [holidaysSearch, setHolidaysSearch] = useState("");

  const fetchUsers = async () => {
    if (!token) return;
    setUsersLoading(true);
    try {
      const data = await getAllUsers(token);
      setUsers(data);
      setUsersPage(1);
      setHierarchyPage(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUsersLoading(false);
    }
  };

  const fetchInvitations = async () => {
    if (!token) return;
    setInvitationsLoading(true);
    try {
      const data = await getInvitations(token);
      setInvitations(data);
      setInvitationsPage(1);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInvitationsLoading(false);
    }
  };


  const fetchPoliciesAndHolidays = async () => {
    if (!token) return;
    try {
      const [p, h] = await Promise.all([getPolicies(token), getHolidays(token)]);
      setPolicies(p);
      setHolidays(h);
      setHolidaysPage(1);
      if (p.length > 0) {
        const latest = p[0];
        setPolicyForm({
          year: latest.year,
          sick_leaves: latest.sick_leaves,
          casual_leaves: latest.casual_leaves,
          floater_leaves: latest.floater_leaves,
        });
        setHolidayForm((f) => ({ ...f, policy_id: latest.id }));
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchInvitations();
    fetchPoliciesAndHolidays();
  }, [token]);


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
      await createUser(token!, {
        name, email, employee_id, password, role,
        manager_id: manager_id || null,
      });
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

  const handleInviteUser = async () => {
    const { name, email, employee_id, role, manager_id } = inviteForm;
    if (!name || !email || !employee_id) {
      notify("Name, email and employee ID are required.", true); return;
    }
    if (!email.endsWith("@test.com")) {
      notify("Email must end with @test.com", true); return;
    }
    setInviteFormLoading(true);
    try {
      await createInvitation(token!, { name, email, employee_id, role, manager_id: manager_id || null });
      notify(`Invitation sent to ${email}`);
      setInviteForm({ name: "", email: "", employee_id: "", role: "employee", manager_id: "" });
      setShowInviteForm(false);
      fetchInvitations();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setInviteFormLoading(false);
    }
  };

  const handleCancelInvite = async (id: string) => {
    if (!confirm("Cancel this invitation?")) return;
    try {
      await cancelInvitation(token!, id);
      notify("Invitation cancelled.");
      fetchInvitations();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleResendInvite = async (id: string) => {
    try {
      await resendInvitation(token!, id);
      notify("Invitation resent.");
      fetchInvitations();
    } catch (err: any) {
      notify(err.message, true);
    }
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
    return users.find((u) => u.id === managerId)?.name ?? "—";
  };

  const handlePolicySubmit = async () => {
    setPolicyLoading(true);
    try {
      await upsertPolicy(token!, policyForm);
      notify("Policy saved successfully.");
      fetchPoliciesAndHolidays();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setPolicyLoading(false);
    }
  };

  const handleAddHoliday = async () => {
    if (!holidayForm.policy_id || !holidayForm.name || !holidayForm.date) {
      notify("Policy, name and date are required.", true); return;
    }
    setHolidayLoading(true);
    try {
      await addHoliday(token!, holidayForm);
      setHolidayForm((f) => ({ ...f, name: "", date: "", is_floater: false }));
      notify("Holiday added.");
      fetchPoliciesAndHolidays();
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
      fetchPoliciesAndHolidays();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setDeletingHolidayId(null);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

  const tabs: { key: Tab; label: string }[] = [
    { key: "users",       label: "Users" },
    { key: "invitations", label: "Invitations" },
    { key: "hierarchy",   label: "Reporting Hierarchy" },
    { key: "policy",      label: "Leave Policy" },
    { key: "holidays",    label: "Holidays" },
  ];

  const managerOptions = users.filter((u) => u.role === "manager" || u.role === "hr" || u.role === "admin");

  const matchQ = (q: string, ...fields: (string | number | null | undefined)[]) =>
    fields.some((f) => String(f ?? "").toLowerCase().includes(q.toLowerCase()));

  const filteredUsers = usersSearch
    ? users.filter((u) => matchQ(usersSearch, u.name, u.email, u.employee_id, u.role, getManagerName(u.manager_id)))
    : users;

  const filteredInvitations = invitationsSearch
    ? invitations.filter((inv) => matchQ(invitationsSearch, inv.name, inv.email, inv.employee_id, inv.role, inv.status))
    : invitations;

  const filteredHierarchy = hierarchySearch
    ? users.filter((u) => matchQ(hierarchySearch, u.name, u.employee_id, u.role, getManagerName(u.manager_id)))
    : users;

  const filteredHolidays = holidaysSearch
    ? holidays.filter((h) => matchQ(holidaysSearch, h.name, h.date, h.policies?.year, h.is_floater ? "floater" : ""))
    : holidays;

  const handleRefresh = () => {
    if (activeTab === "users") fetchUsers();
    else if (activeTab === "invitations") fetchInvitations();
    else if (activeTab === "policy" || activeTab === "holidays") fetchPoliciesAndHolidays();
    else if (activeTab === "hierarchy") fetchUsers();
  };

  const isRefreshing = usersLoading || invitationsLoading || policyLoading || holidayLoading;

  return (
    <div className="space-y-6 max-w-5xl">
 
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Admin Panel</h2>
          <p className="text-sm text-slate-500 mt-0.5">Manage users, hierarchy, leave policies and holidays</p>
        </div>
        {activeTab !== "policy" && (
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl transition-colors bg-white hover:bg-slate-50 disabled:opacity-50 shadow-sm"
          >
            <svg className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
        )}
      </div>

      {error && (
        <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">{error}</div>
      )}
      {success && (
        <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">{success}</div>
      )}

      <div className="flex gap-1.5 bg-slate-100 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              activeTab === tab.key ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "users" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <h3 className="font-bold text-slate-800">All Users</h3>
              <p className="text-sm text-slate-500 mt-0.5">Create, view and delete user accounts</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
                <input type="text" value={usersSearch} onChange={(e) => { setUsersSearch(e.target.value); setUsersPage(1); }} placeholder="Search users..." className="pl-9 pr-4 py-2 w-48 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <button onClick={() => setShowUserForm((v) => !v)}
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
                  { key: "name",        label: "Full Name",    type: "text",     placeholder: "e.g. Revathi V" },
                  { key: "email",       label: "Email",        type: "email",    placeholder: "e.g. revathi@company.com" },
                  { key: "employee_id", label: "Employee ID",  type: "text",     placeholder: "e.g. EMP003" },
                  { key: "password",    label: "Password",     type: "password", placeholder: "Min. 8 characters" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                    <input type={type} placeholder={placeholder}
                      value={userForm[key as keyof typeof userForm] as string}
                      onChange={(e) => setUserForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                  <select value={userForm.role}
                    onChange={(e) => setUserForm((f) => ({ ...f, role: e.target.value as any }))}
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
                    onChange={(e) => setUserForm((f) => ({ ...f, manager_id: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white appearance-none">
                    <option value="">No manager</option>
                    {managerOptions.map((u) => (
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
                ) : filteredUsers.slice((usersPage - 1) * usersPageSize, usersPage * usersPageSize).map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-slate-500 font-mono text-xs">{u.employee_id}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{u.name}</td>
                    <td className="px-5 py-4 text-slate-600">{u.email}</td>
                    <td className="px-5 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full capitalize ${ROLE_STYLES[u.role]}`}>
                        {u.role}
                      </span>
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
            onPageSizeChange={(size) => { setUsersPageSize(size); setUsersPage(1); }}
          />
        </div>
      )}

      {activeTab === "invitations" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Email Invitations</h3>
              <p className="text-sm text-slate-500 mt-0.5">Invite employees via email and manage pending setups.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
                <input type="text" value={invitationsSearch} onChange={(e) => { setInvitationsSearch(e.target.value); setInvitationsPage(1); }} placeholder="Search invitations..." className="pl-9 pr-4 py-2 w-48 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              <button onClick={() => setShowInviteForm((v) => !v)}
                className="bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm whitespace-nowrap">
                {showInviteForm ? "Cancel" : "+ Invite Employee"}
              </button>
            </div>
          </div>

          {showInviteForm && (
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
              <h4 className="font-semibold text-slate-700">New Invitation</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { key: "name",        label: "Full Name",    type: "text",     placeholder: "e.g. Rahul V" },
                  { key: "email",       label: "Email",        type: "email",    placeholder: "e.g. rahul@test.com" },
                  { key: "employee_id", label: "Employee ID",  type: "text",     placeholder: "e.g. EMP004" },
                ].map(({ key, label, type, placeholder }) => (
                  <div key={key}>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                    <input type={type} placeholder={placeholder}
                      value={inviteForm[key as keyof typeof inviteForm] as string}
                      onChange={(e) => setInviteForm((f) => ({ ...f, [key]: e.target.value }))}
                      className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                  </div>
                ))}

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                  <select value={inviteForm.role}
                    onChange={(e) => setInviteForm((f) => ({ ...f, role: e.target.value as any }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white appearance-none">
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr">HR</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reports To (optional)</label>
                  <select value={inviteForm.manager_id}
                    onChange={(e) => setInviteForm((f) => ({ ...f, manager_id: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white appearance-none">
                    <option value="">No manager</option>
                    {managerOptions.map((u) => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                    ))}
                  </select>
                </div>
              </div>

              <button onClick={handleInviteUser} disabled={inviteFormLoading}
                className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm">
                {inviteFormLoading ? "Sending..." : "Send Invitation"}
              </button>
            </div>
          )}

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Employee ID", "Name", "Email", "Status", "Sent At", "Actions"].map((h, i) => (
                    <th key={i} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {invitationsLoading ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : filteredInvitations.length === 0 ? (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-slate-400">{invitationsSearch ? "No results match your search" : "No invitations yet."}</td></tr>
                ) : filteredInvitations.slice((invitationsPage - 1) * invitationsPageSize, invitationsPage * invitationsPageSize).map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-5 py-4 text-slate-500 font-mono text-xs">{inv.employee_id}</td>
                    <td className="px-5 py-4 font-semibold text-slate-800">{inv.name}</td>
                    <td className="px-5 py-4 text-slate-600">{inv.email}</td>
                    <td className="px-5 py-4">
                      {inv.status === "pending" && <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">Pending</span>}
                      {inv.status === "accepted" && <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">Accepted</span>}
                      {inv.status === "cancelled" && <span className="bg-slate-100 text-slate-500 text-xs font-semibold px-2.5 py-1 rounded-full">Cancelled</span>}
                    </td>
                    <td className="px-5 py-4 text-slate-500 text-xs">{new Date(inv.created_at).toLocaleString()}</td>
                    <td className="px-5 py-4 flex gap-2">
                       {inv.status === "pending" && (
                         <>
                           <button onClick={() => handleResendInvite(inv.id)} className="text-xs font-semibold text-blue-500 hover:text-blue-600 border border-blue-200 hover:border-blue-300 px-3 py-1.5 rounded-lg transition-colors">Resend</button>
                           <button onClick={() => handleCancelInvite(inv.id)} className="text-xs font-semibold text-rose-500 hover:text-rose-600 border border-rose-200 hover:border-rose-300 px-3 py-1.5 rounded-lg transition-colors">Cancel</button>
                         </>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={invitationsPage}
            totalPages={Math.max(1, Math.ceil(filteredInvitations.length / invitationsPageSize))}
            totalItems={filteredInvitations.length}
            pageSize={invitationsPageSize}
            onPageChange={setInvitationsPage}
            onPageSizeChange={(size) => { setInvitationsPageSize(size); setInvitationsPage(1); }}
          />
        </div>
      )}

      {activeTab === "hierarchy" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Reporting Hierarchy</h3>
              <p className="text-sm text-slate-500 mt-0.5">Set who each user reports to. Changes are batched — click Save when done.</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
                <input type="text" value={hierarchySearch} onChange={(e) => { setHierarchySearch(e.target.value); setHierarchyPage(1); }} placeholder="Search by name, role..." className="pl-9 pr-4 py-2 w-48 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" />
              </div>
              {Object.keys(hierarchyChanges).length > 0 || Object.keys(roleChanges).length > 0 ? (
                <button onClick={handleSaveHierarchy} disabled={savingHierarchy}
                  className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold px-5 py-2 rounded-xl transition-colors shadow-sm text-sm whitespace-nowrap">
                  {savingHierarchy ? "Saving..." : "Save changes"}
                </button>
              ) : null}
            </div>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  {["Employee", "Role", "Currently Reports To", "Change To"].map((h) => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {usersLoading ? (
                  <tr><td colSpan={4} className="px-5 py-8 text-center text-slate-400">Loading...</td></tr>
                ) : filteredHierarchy.slice((hierarchyPage - 1) * hierarchyPageSize, hierarchyPage * hierarchyPageSize).map((u) => {
                  const currentManagerId = hierarchyChanges.hasOwnProperty(u.id)
                    ? hierarchyChanges[u.id]
                    : u.manager_id;
                  const currentRole = roleChanges.hasOwnProperty(u.id)
                    ? roleChanges[u.id]
                    : u.role;
                  const isDirty = hierarchyChanges.hasOwnProperty(u.id) || roleChanges.hasOwnProperty(u.id);

                  return (
                    <tr key={u.id} className={`transition-colors ${isDirty ? "bg-amber-50" : "hover:bg-slate-50"}`}>
                      <td className="px-5 py-4">
                        <p className="font-semibold text-slate-800">{u.name}</p>
                        <p className="text-xs text-slate-400 font-mono">{u.employee_id}</p>
                      </td>
                      <td className="px-5 py-4">
                        <select
                          value={currentRole}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === u.role) {
                              setRoleChanges((prev) => {
                                const next = { ...prev };
                                delete next[u.id];
                                return next;
                              });
                            } else {
                              setRoleChanges((prev) => ({ ...prev, [u.id]: val }));
                            }
                          }}
                          className={`px-3 py-1 border border-slate-200 rounded-lg text-xs font-bold uppercase transition-colors cursor-pointer appearance-none ${ROLE_STYLES[currentRole]}`}>
                          <option value="employee" className="bg-white text-slate-800">EMPLOYEE</option>
                          <option value="manager" className="bg-white text-slate-800">MANAGER</option>
                          <option value="hr" className="bg-white text-slate-800">HR</option>
                          <option value="admin" className="bg-white text-slate-800">ADMIN</option>
                        </select>
                      </td>
                      <td className="px-5 py-4 text-slate-500">{getManagerName(u.manager_id)}</td>
                      <td className="px-5 py-4">
                        <select
                          value={currentManagerId ?? ""}
                          onChange={(e) => {
                            const val = e.target.value || null;
                           
                            if (val === u.manager_id) {
                              setHierarchyChanges((prev) => {
                                const next = { ...prev };
                                delete next[u.id];
                                return next;
                              });
                            } else {
                              setHierarchyChanges((prev) => ({ ...prev, [u.id]: val }));
                            }
                          }}
                          className="px-3 py-2 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white appearance-none">
                          <option value="">No manager</option>
                          {users
                            .filter((m) => m.id !== u.id && (m.role === "manager" || m.role === "hr" || m.role === "admin"))
                            .map((m) => (
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
            onPageSizeChange={(size) => { setHierarchyPageSize(size); setHierarchyPage(1); }}
          />
        </div>
      )}

  
      {activeTab === "policy" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div>
            <h3 className="font-bold text-slate-800">Leave Policy</h3>
            <p className="text-sm text-slate-500 mt-0.5">Set annual leave quotas per year. Saving will create or update the policy for that year.</p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Year</label>
              <input type="number" value={policyForm.year}
                onChange={(e) => setPolicyForm((p) => ({ ...p, year: +e.target.value }))}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50" />
            </div>
            {[
              { key: "sick_leaves",    label: "Sick Leaves" },
              { key: "casual_leaves",  label: "Casual Leaves" },
              { key: "floater_leaves", label: "Floater Leaves" },
            ].map(({ key, label }) => (
              <div key={key}>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                <input type="number" min={0}
                  value={policyForm[key as keyof typeof policyForm]}
                  onChange={(e) => setPolicyForm((p) => ({ ...p, [key]: +e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50" />
              </div>
            ))}
          </div>

          <button onClick={handlePolicySubmit} disabled={policyLoading}
            className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors shadow-sm">
            {policyLoading ? "Saving..." : "Save Policy"}
          </button>

          {policies.length > 0 && (
            <div className="overflow-x-auto rounded-xl border border-slate-200">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    {["Year", "Sick", "Casual", "Floater"].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {policies.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50">
                      <td className="px-5 py-3 font-semibold text-slate-700">{p.year}</td>
                      <td className="px-5 py-3 text-slate-600">{p.sick_leaves}</td>
                      <td className="px-5 py-3 text-slate-600">{p.casual_leaves}</td>
                      <td className="px-5 py-3 text-slate-600">{p.floater_leaves}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {activeTab === "holidays" && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div>
              <h3 className="font-bold text-slate-800">Holidays</h3>
              <p className="text-sm text-slate-500 mt-0.5">Add or remove holidays for any policy year.</p>
            </div>
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
              <input type="text" value={holidaysSearch} onChange={(e) => { setHolidaysSearch(e.target.value); setHolidaysPage(1); }} placeholder="Search holidays..." className="pl-9 pr-4 py-2 w-48 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Policy Year</label>
                <select value={holidayForm.policy_id}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, policy_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50 appearance-none">
                  <option value="">Select year</option>
                  {policies.map((p) => (
                    <option key={p.id} value={p.id}>{p.year}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Holiday Name</label>
                <input type="text" value={holidayForm.name} placeholder="e.g. Pongal"
                  onChange={(e) => setHolidayForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50" />
              </div> 
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
                <input type="date" value={holidayForm.date}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, date: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-slate-50" />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={holidayForm.is_floater}
                  onChange={(e) => setHolidayForm((f) => ({ ...f, is_floater: e.target.checked }))}
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
                ) : filteredHolidays.slice((holidaysPage - 1) * holidaysPageSize, holidaysPage * holidaysPageSize).map((h) => (
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
            onPageSizeChange={(size) => { setHolidaysPageSize(size); setHolidaysPage(1); }}
          />
        </div>
      )}
    </div>
  );
}