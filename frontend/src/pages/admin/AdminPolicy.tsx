import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { getPolicies, upsertPolicy } from "../../api/admin";

export default function AdminPolicy() {
  const { token } = useAuth();

  const [error, setError]     = useState("");
  const [success, setSuccess] = useState("");

  const [policies, setPolicies]   = useState<any[]>([]);
  const [policyForm, setPolicyForm] = useState({
    year: new Date().getFullYear(),
    sick_leaves: 0, casual_leaves: 0, floater_leaves: 0,
  });
  const [policyLoading, setPolicyLoading] = useState(false);

  const fetchPolicies = async () => {
    if (!token) return;
    try {
      const p = await getPolicies(token);
      setPolicies(p);
      if (p.length > 0) {
        const latest = p[0];
        setPolicyForm({
          year: latest.year,
          sick_leaves: latest.sick_leaves,
          casual_leaves: latest.casual_leaves,
          floater_leaves: latest.floater_leaves,
        });
      }
    } catch (err: any) {
      setError(err.message);
    }
  };

  useEffect(() => { fetchPolicies(); }, [token]);

  const notify = (msg: string, isError = false) => {
    if (isError) { setError(msg); setSuccess(""); }
    else { setSuccess(msg); setError(""); }
    setTimeout(() => { setError(""); setSuccess(""); }, 4000);
  };

  const handlePolicySubmit = async () => {
    setPolicyLoading(true);
    try {
      await upsertPolicy(token!, policyForm);
      notify("Policy saved successfully.");
      fetchPolicies();
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setPolicyLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h2 className="text-xl font-bold text-slate-800">Leave Policy</h2>
        <p className="text-sm text-slate-500 mt-0.5">Set annual leave quotas per year</p>
      </div>

      {error && <div className="px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">{error}</div>}
      {success && <div className="px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">{success}</div>}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
        <div>
          <h3 className="font-bold text-slate-800">Leave Policy</h3>
          <p className="text-sm text-slate-500 mt-0.5">Set annual leave quotas per year. Saving will create or update the policy for that year.</p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Year</label>
            <input type="number" value={policyForm.year}
              onChange={e => setPolicyForm(p => ({ ...p, year: +e.target.value }))}
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
                onChange={e => setPolicyForm(p => ({ ...p, [key]: +e.target.value }))}
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
                  {["Year", "Sick", "Casual", "Floater"].map(h => (
                    <th key={h} className="text-left px-5 py-3 text-xs font-bold uppercase tracking-wider text-slate-500">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {policies.map(p => (
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
    </div>
  );
}
