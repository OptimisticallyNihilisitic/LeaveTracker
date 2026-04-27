import { useState, useEffect } from "react";
import { getInvitationDetails, acceptInvitation, type InvitationDetails } from "../api/invite";

export default function InviteSetup() {
  const [token, setToken] = useState("");
  
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    if (pathParts.length > 2 && pathParts[1] === 'invite') {
      setToken(pathParts[2]);
    }
  }, []);

  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<InvitationDetails | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!token) return;
    getInvitationDetails(token)
      .then((data) => {
        setDetails(data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message || "Invalid or expired invitation link.");
        setLoading(false);
      });
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await acceptInvitation(token!, { password });
      setSuccess(true);
    } catch (err: any) {
      setError(err.message || "An error occurred while setting up your account.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <p className="text-slate-500 font-medium">Loading invitation details...</p>
      </div>
    );
  }

  if (error && !details) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md text-center">
          <div className="w-12 h-12 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Invalid Link</h2>
          <p className="text-slate-500 mb-6">{error}</p>
          <button onClick={() => window.location.href = "/"} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-xl transition-all">
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-inner">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mt-4">Account Set Up!</h2>
          <p className="text-slate-500">Your account has been successfully created. You can now log in with your email and password.</p>
          <div className="pt-4">
             <button onClick={() => window.location.href = "/"} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-semibold py-3 rounded-xl shadow-lg shadow-emerald-200 transition-all">
                Continue to Login
             </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl border border-slate-100 w-full max-w-md space-y-6">
        <div className="text-center">
           <h2 className="text-2xl font-bold text-slate-800">Welcome, {details?.name}!</h2>
           <p className="text-slate-500 mt-1 flex flex-col items-center">
             <span>You've been invited to join as a <strong className="text-slate-700 capitalize">{details?.role}</strong>.</span>
             <span className="text-xs bg-slate-100 px-2.5 py-1 rounded-full mt-2 font-mono text-slate-600 border border-slate-200">{details?.email}</span>
           </p>
        </div>

        {error && (
           <div className="p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-medium rounded-xl text-center">
             {error}
           </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Create Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all transition-all duration-200 appearance-none"
              placeholder="Minimum 8 characters"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1.5 ml-1">Confirm Password</label>
            <input 
              type="password" 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:bg-white transition-all appearance-none duration-200"
              placeholder="Re-enter your password"
              required
            />
          </div>

          <div className="pt-4">
            <button 
              type="submit" 
              disabled={submitting}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-200 transition-all font-semibold"
            >
              {submitting ? "Setting up..." : "Complete Setup"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
