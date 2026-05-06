import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/change-password`,
      });
      
      if (error) throw new Error(error.message);
      
      setMessage("If this email is registered, you will receive a password reset link shortly.");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-emerald-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/60 border border-slate-100 p-8">
        <h2 className="text-xl font-bold text-slate-800 mb-2">Forgot Password</h2>
        <p className="text-slate-500 text-sm mb-6">
          Enter your email to receive a password reset link.
        </p>

        <form onSubmit={handleRequestReset} className="space-y-5">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
            />
          </div>

          {error && <p className="text-sm text-rose-500 font-medium">{error}</p>}
          {message && <p className="text-sm text-emerald-500 font-medium">{message}</p>}

          <button
            type="submit"
            disabled={loading || !email}
            className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-emerald-200"
          >
            {loading ? "Sending..." : "Send Reset Link"}
          </button>
          <div className="text-center mt-4">
            <a href="/" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-sm font-medium text-slate-500 hover:text-slate-800">
              Back to Login
            </a>
          </div>
        </form>
      </div>
    </div>
  );
}
