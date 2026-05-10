import { useState } from "react";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(249,115,22,0.18),transparent_45%),radial-gradient(900px_circle_at_90%_10%,rgba(251,146,60,0.12),transparent_45%),linear-gradient(to_bottom,rgb(10,12,16),rgb(8,10,14))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-accent rounded-2xl shadow-soft mb-4 ring-1 ring-white/10">
            <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-fg tracking-tight">LeaveTracker</h1>
          <p className="text-muted text-sm mt-1">Employee Leave Management System</p>
        </div>

        <div className="app-card p-8">
          <h2 className="text-xl font-bold text-fg mb-6">Sign in to your account</h2>

          <form onSubmit={handleLoginSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-fg/90 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="app-input"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-fg/90 mb-1.5">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="app-input"
              />
            </div>

            <div className="flex justify-end">
              <a
                href="/forgot-password"
                onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/forgot-password'); window.dispatchEvent(new PopStateEvent('popstate')); }}
                className="text-sm font-medium text-accent hover:text-accent-2"
              >
                Forgot Password?
              </a>
            </div>

            {error && (
              <p className="text-sm text-danger font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full app-btn-primary py-3"
            >
              {loading ? "Signing in..." : "Sign In"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}