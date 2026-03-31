import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { requestRegularization } from "../api/attendance";

export default function RegularizeAttendance() {
  const { token } = useAuth();
  const [date, setDate] = useState("");
  const [reason, setReason] = useState("Forgot to check out");
  const [comments, setComments] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    if (!date || !reason) {
      setError("Date and reason are required.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await requestRegularization(token!, {
        date,
        reason: comments ? `${reason} — ${comments}` : reason,
      });
      setSuccess(true);
      setDate(""); setComments("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Regularization Request Form</h2>
        <p className="text-sm text-slate-500 mb-6">Submit a request to correct your attendance record.</p>

        {success && (
          <div className="mb-5 px-4 py-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-sm font-medium">
            Regularization request submitted successfully!
          </div>
        )}
        {error && (
          <div className="mb-5 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-600 text-sm font-medium">
            {error}
          </div>
        )}

        <div className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Date</label>
            <input type="date" value={date} onChange={(e) => { setDate(e.target.value); setSuccess(false); }}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-slate-50" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Reason</label>
            <select value={reason} onChange={(e) => setReason(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-slate-50 appearance-none">
              <option>Forgot to check out</option>
              <option>Forgot to check in</option>
              <option>System error</option>
              <option>Work from home</option>
              <option>Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Comments</label>
            <textarea value={comments} onChange={(e) => setComments(e.target.value)} rows={4}
              placeholder="Add any additional comments..."
              className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all bg-slate-50 resize-none" />
          </div>

          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm">
              {loading ? "Submitting..." : "Submit"}
            </button>
            <button onClick={() => { setDate(""); setComments(""); setError(""); setSuccess(false); }}
              className="flex-1 bg-white hover:bg-rose-50 text-rose-500 font-semibold py-3 rounded-xl border border-rose-200 transition-colors">
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}