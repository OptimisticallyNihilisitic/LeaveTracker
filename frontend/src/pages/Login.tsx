import { useState, useEffect, useRef } from "react";
import { useAuth } from "../context/AuthContext";

const OTP_DURATION = 600; // 10 minutes in seconds

export default function Login() {
  const { initiateLogin, verifyOtp } = useAuth();

  // ── Step control ──────────────────────────────────────────────────────────
  const [step, setStep] = useState<"credentials" | "otp">("credentials");

  // ── Step 1 state ──────────────────────────────────────────────────────────
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // ── Step 2 state ──────────────────────────────────────────────────────────
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [timeLeft, setTimeLeft] = useState(OTP_DURATION);
  const [resendCooldown, setResendCooldown] = useState(60);
  const [canResend, setCanResend] = useState(false);

  // ── Shared state ──────────────────────────────────────────────────────────
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── OTP countdown timer ───────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "otp") return;
    setTimeLeft(OTP_DURATION);
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) { clearInterval(timer); return 0; }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [step]);

  // ── Resend cooldown ───────────────────────────────────────────────────────
  useEffect(() => {
    if (step !== "otp") return;
    setCanResend(false);
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown((c) => {
        if (c <= 1) { clearInterval(interval); setCanResend(true); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [step]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await initiateLogin(email, password);
      setStep("otp");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return; // digits only
    const next = [...otp];
    next[index] = value.slice(-1); // keep last digit
    setOtp(next);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    const lastFilled = Math.min(pasted.length, 5);
    otpRefs.current[lastFilled]?.focus();
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = otp.join("");
    if (code.length !== 6) { setError("Please enter the complete 6-digit OTP"); return; }
    setError("");
    setLoading(true);
    try {
      await verifyOtp(email, password, code);
      // On success AuthContext sets the user — App.tsx will redirect automatically
    } catch (err: any) {
      setError(err.message);
      setOtp(["", "", "", "", "", ""]);
      otpRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend) return;
    setError("");
    setOtp(["", "", "", "", "", ""]);
    setLoading(true);
    try {
      await initiateLogin(email, password);
      setStep("credentials");
      setTimeout(() => setStep("otp"), 50); // re-trigger effects
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setStep("credentials");
    setOtp(["", "", "", "", "", ""]);
    setError("");
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[radial-gradient(1200px_circle_at_20%_-10%,rgba(249,115,22,0.18),transparent_45%),radial-gradient(900px_circle_at_90%_10%,rgba(251,146,60,0.12),transparent_45%),linear-gradient(to_bottom,rgb(10,12,16),rgb(8,10,14))] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo / header */}
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
          {/* ─── Step 1: Credentials ─────────────────────────────────── */}
          {step === "credentials" && (
            <>
              <h2 className="text-xl font-bold text-fg mb-6">Sign in to your account</h2>
              <form onSubmit={handleCredentialsSubmit} className="space-y-5">
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
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                      className="app-input pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-fg transition-colors"
                      tabIndex={-1}
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
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

                {error && <p className="text-sm text-danger font-medium">{error}</p>}

                <button type="submit" disabled={loading} className="w-full app-btn-primary py-3">
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Verifying...
                    </span>
                  ) : "Continue"}
                </button>
              </form>
            </>
          )}

          {/* ─── Step 2: OTP Verification ────────────────────────────── */}
          {step === "otp" && (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <button
                  onClick={handleBack}
                  className="text-muted hover:text-fg transition-colors p-1 rounded-lg hover:bg-white/5"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <div>
                  <h2 className="text-xl font-bold text-fg">Verify your identity</h2>
                </div>
              </div>

              {/* Shield icon + email hint */}
              <div className="flex flex-col items-center mb-7">
                <div className="w-16 h-16 rounded-2xl bg-accent/15 border border-accent/30 flex items-center justify-center mb-4">
                  <svg className="w-8 h-8 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                  </svg>
                </div>
                <p className="text-muted text-sm text-center">
                  We sent a 6-digit OTP to<br />
                  <span className="text-fg font-semibold">{email}</span>
                </p>
              </div>

              {/* Countdown */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <svg className="w-4 h-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6l4 2m6-2a10 10 0 11-20 0 10 10 0 0120 0z" />
                </svg>
                <span className={`text-sm font-mono font-semibold ${timeLeft <= 60 ? "text-danger" : "text-muted"}`}>
                  {timeLeft > 0 ? `Expires in ${formatTime(timeLeft)}` : "OTP expired — please go back and login again"}
                </span>
              </div>

              {/* OTP inputs */}
              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div className="flex gap-3 justify-center" onPaste={handleOtpPaste}>
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => { otpRefs.current[i] = el; }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(i, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(i, e)}
                      disabled={timeLeft === 0}
                      className="w-12 h-14 text-center text-xl font-bold rounded-xl border border-white/10 bg-white/5 text-fg focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent transition-all disabled:opacity-40"
                    />
                  ))}
                </div>

                {error && <p className="text-sm text-danger font-medium text-center">{error}</p>}

                <button
                  type="submit"
                  disabled={loading || timeLeft === 0 || otp.join("").length < 6}
                  className="w-full app-btn-primary py-3"
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Verifying OTP...
                    </span>
                  ) : "Verify & Sign In"}
                </button>

                <p className="text-center text-sm text-muted">
                  Didn't receive it?{" "}
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={!canResend || loading}
                    className={`font-semibold transition-colors ${canResend ? "text-accent hover:text-accent-2 cursor-pointer" : "text-muted/50 cursor-not-allowed"}`}
                  >
                    {canResend ? "Resend OTP" : `Resend in ${resendCooldown}s`}
                  </button>
                </p>
              </form>
            </>
          )}
        </div>

        {/* Step indicator */}
        <div className="flex justify-center gap-2 mt-6">
          <div className={`h-1.5 w-8 rounded-full transition-all ${step === "credentials" ? "bg-accent" : "bg-white/20"}`} />
          <div className={`h-1.5 w-8 rounded-full transition-all ${step === "otp" ? "bg-accent" : "bg-white/20"}`} />
        </div>
      </div>
    </div>
  );
}