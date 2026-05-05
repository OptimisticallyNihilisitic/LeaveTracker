import { useState } from "react";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [step, setStep] = useState<"request" | "verify">("request");
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);
    
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api/mfa/send-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to send OTP");
      
      setMessage(data.message);
      setStep("verify");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");
    
    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api/mfa/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, otp, new_password: newPassword }),
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      
      setMessage("Password successfully reset! You can now log in.");
      setTimeout(() => {
        window.history.pushState({}, '', '/'); 
        window.dispatchEvent(new PopStateEvent('popstate'));
      }, 3000);
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
          {step === "request" 
            ? "Enter your email to receive a password reset OTP." 
            : "Enter the OTP sent to your email and your new password."}
        </p>

        {step === "request" ? (
          <form onSubmit={handleRequestOtp} className="space-y-5">
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
              {loading ? "Sending..." : "Send OTP"}
            </button>
            <div className="text-center mt-4">
              <a href="/" onClick={(e) => { e.preventDefault(); window.history.pushState({}, '', '/'); window.dispatchEvent(new PopStateEvent('popstate')); }} className="text-sm font-medium text-slate-500 hover:text-slate-800">
                Back to Login
              </a>
            </div>
          </form>
        ) : (
          <form onSubmit={handleVerifyAndReset} className="space-y-5">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Email</label>
              <input
                type="email"
                value={email}
                disabled
                className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 text-sm cursor-not-allowed"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">OTP</label>
              <input
                type="text"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                required
                maxLength={6}
                className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-slate-800 placeholder-slate-400 text-center tracking-widest text-lg font-bold focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Enter new password"
                required
                className="w-full px-4 py-3 bg-emerald-50 border border-emerald-100 rounded-xl text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:border-transparent transition-all"
              />
            </div>

            {error && <p className="text-sm text-rose-500 font-medium">{error}</p>}
            {message && <p className="text-sm text-emerald-500 font-medium">{message}</p>}

            <button
              type="submit"
              disabled={loading || otp.length < 6 || newPassword.length < 6}
              className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold py-3 rounded-xl transition-colors shadow-sm shadow-emerald-200"
            >
              {loading ? "Resetting..." : "Verify & Reset Password"}
            </button>
            <div className="text-center mt-4">
              <button 
                type="button" 
                onClick={() => setStep("request")} 
                className="text-sm font-medium text-slate-500 hover:text-slate-800"
              >
                Back to email request
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
