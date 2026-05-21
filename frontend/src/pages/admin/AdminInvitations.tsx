import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import {
  getAllUsers,
  getInvitations, createInvitation, cancelInvitation, resendInvitation, createBulkInvitations,
  type InvitationRecord,
} from "../../api/admin";
import Pagination from "../../components/Pagination";

interface UserRecord {
  id: string;
  name: string;
  role: "employee" | "manager" | "hr" | "admin";
}

export default function AdminInvitations() {
  const { token } = useAuth();

  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const [users, setUsers]                   = useState<UserRecord[]>([]);
  const [invitations, setInvitations]       = useState<InvitationRecord[]>([]);
  const [invitationsLoading, setInvitationsLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [showBulkInviteForm, setShowBulkInviteForm] = useState(false);
  const [bulkInviteLoading, setBulkInviteLoading] = useState(false);
  const [inviteForm, setInviteForm]         = useState({
    name: "", email: "", employee_id: "",
    role: "employee" as "employee" | "manager" | "hr" | "admin",
    manager_id: "",
  });
  const [inviteFormLoading, setInviteFormLoading] = useState(false);

  const [invitationsPage, setInvitationsPage]         = useState(1);
  const [invitationsPageSize, setInvitationsPageSize] = useState(5);
  const [invitationsSearch, setInvitationsSearch]     = useState("");

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

  useEffect(() => {
    if (!token) return;
    getAllUsers(token).then(data => setUsers(data)).catch(() => {});
    fetchInvitations();
  }, [token]);

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
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

  const handleBulkUpload = (file: File) => {
    if (!file) return;
    setBulkInviteLoading(true);
    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result;
      if (typeof text !== "string") {
        setBulkInviteLoading(false);
        return;
      }
      const lines = text.split("\n").map(l => l.trim()).filter(l => l);
      if (lines.length === 0) {
        notify("CSV is empty", true);
        setBulkInviteLoading(false);
        return;
      }
      
      const parsedInvs = [];
      let startIdx = 0;
      if (lines[0].toLowerCase().includes("name") || lines[0].toLowerCase().includes("email")) {
        startIdx = 1;
      }
      for (let i = startIdx; i < lines.length; i++) {
        const parts = lines[i].split(",").map(p => p.trim());
        if (parts.length >= 4) {
          parsedInvs.push({
            name: parts[0],
            employee_id: parts[1],
            role: parts[2] || "employee",
            email: parts[3]
          });
        }
      }
      
      if (parsedInvs.length === 0) {
        notify("No valid rows found in CSV", true);
        setBulkInviteLoading(false);
        return;
      }

      try {
        const res = await createBulkInvitations(token!, { invitations: parsedInvs });
        notify(`Bulk invite complete: ${res.successful} sent, ${res.failed} failed.`);
        if (res.errors && res.errors.length > 0) {
          console.error("Bulk invite errors:", res.errors);
        }
        setShowBulkInviteForm(false);
        fetchInvitations();
      } catch (err: any) {
        notify(err.message, true);
      } finally {
        setBulkInviteLoading(false);
      }
    };
    reader.onerror = () => {
      notify("Failed to read file", true);
      setBulkInviteLoading(false);
    };
    reader.readAsText(file);
  };

  const managerOptions = users.filter(u => u.role === "manager" || u.role === "hr" || u.role === "admin");

  const matchQ = (q: string, ...fields: (string | number | null | undefined)[]) =>
    fields.some(f => String(f ?? "").toLowerCase().includes(q.toLowerCase()));

  const filteredInvitations = invitationsSearch
    ? invitations.filter(inv => matchQ(invitationsSearch, inv.name, inv.email, inv.employee_id, inv.role, inv.status))
    : invitations;

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Invitations</h2>
          <p className="text-sm text-slate-500 mt-0.5">Invite employees via email and manage pending setups</p>
        </div>
        <button
          onClick={fetchInvitations}
          disabled={invitationsLoading}
          className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 px-4 py-2 rounded-xl transition-colors bg-white hover:bg-slate-50 disabled:opacity-50 shadow-sm"
        >
          <svg className={`w-4 h-4 ${invitationsLoading ? "animate-spin" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {invitationsLoading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">{error}</div>}
      {success && <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">{success}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
          <div>
            <h3 className="font-bold text-slate-800">Email Invitations</h3>
            <p className="text-sm text-slate-500 mt-0.5">Invite employees via email and manage pending setups.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" /></svg>
              <input type="text" value={invitationsSearch} onChange={e => { setInvitationsSearch(e.target.value); setInvitationsPage(1); }} placeholder="Search invitations..." className="pl-9 pr-4 py-2 w-48 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 bg-white focus:outline-none focus:ring-2 focus:ring-slate-300" />
            </div>
            <button onClick={() => { setShowBulkInviteForm(v => !v); setShowInviteForm(false); }}
              className="bg-blue-500 hover:bg-blue-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors shadow-sm whitespace-nowrap">
              {showBulkInviteForm ? "Cancel" : "Upload CSV"}
            </button>
            <button onClick={() => { setShowInviteForm(v => !v); setShowBulkInviteForm(false); }}
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
                { key: "name",        label: "Full Name",   type: "text",  placeholder: "e.g. Rahul V" },
                { key: "email",       label: "Email",       type: "email", placeholder: "e.g. rahul@test.com" },
                { key: "employee_id", label: "Employee ID", type: "text",  placeholder: "e.g. EMP004" },
              ].map(({ key, label, type, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
                  <input type={type} placeholder={placeholder}
                    value={inviteForm[key as keyof typeof inviteForm] as string}
                    onChange={e => setInviteForm(f => ({ ...f, [key]: e.target.value }))}
                    className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white" />
                </div>
              ))}

              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Role</label>
                <select value={inviteForm.role}
                  onChange={e => setInviteForm(f => ({ ...f, role: e.target.value as any }))}
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
                  onChange={e => setInviteForm(f => ({ ...f, manager_id: e.target.value }))}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white appearance-none">
                  <option value="">No manager</option>
                  {managerOptions.map(u => (
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

        {showBulkInviteForm && (
          <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 space-y-4">
            <h4 className="font-semibold text-slate-700">Bulk Invite via CSV</h4>
            <p className="text-sm text-slate-500">
              Upload a CSV file with the following column structure (headers optional, but recommended):
              <br /><code className="bg-slate-200 px-1 py-0.5 rounded">emp name, emp id, role, email</code>
            </p>
            <div>
              <input type="file" accept=".csv"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    handleBulkUpload(e.target.files[0]);
                    e.target.value = '';
                  }
                }}
                disabled={bulkInviteLoading}
                className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 transition-colors cursor-pointer"
              />
            </div>
            {bulkInviteLoading && <p className="text-sm text-blue-600 font-semibold">Processing CSV data and sending invitations...</p>}
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
              ) : filteredInvitations.slice((invitationsPage - 1) * invitationsPageSize, invitationsPage * invitationsPageSize).map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-4 text-slate-500 font-mono text-xs">{inv.employee_id}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{inv.name}</td>
                  <td className="px-5 py-4 text-slate-600">{inv.email}</td>
                  <td className="px-5 py-4">
                    {inv.status === "pending"   && <span className="bg-amber-100 text-amber-700 text-xs font-semibold px-2.5 py-1 rounded-full">Pending</span>}
                    {inv.status === "accepted"  && <span className="bg-emerald-100 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full">Accepted</span>}
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
          onPageSizeChange={size => { setInvitationsPageSize(size); setInvitationsPage(1); }}
        />
      </div>
    </div>
  );
}
