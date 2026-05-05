import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { getMe } from "../api/user";
import { getDeviceId } from "../lib/device";
import { apiFetch } from "../api/apiFetch";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: "employee" | "manager" | "admin";
  manager_id: string | null;
  sick_leaves: number;
  casual_leaves: number;
  floater_leaves: number;
}

interface AuthContextType {
  user: UserProfile | null;
  token: string | null;
  loading: boolean;
  mfaPending: boolean;
  login: (email: string, password: string) => Promise<void>;
  verifyMfa: (otp: string) => Promise<void>;
  logout: () => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [mfaPending, setMfaPending] = useState(false);
  const [tempToken, setTempToken] = useState<string | null>(null);

  const loadProfile = async (accessToken: string) => {
    try {
      // Check MFA first
      const mfaRes = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api/mfa/check`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "x-device-id": getDeviceId(),
        },
      });
      const mfaData = await mfaRes.json();

      if (mfaRes.status !== 200 || mfaData.requires_mfa) {
        setMfaPending(true);
        setTempToken(accessToken);
        setUser(null);
        setToken(null);
        return;
      }

      const profile = await getMe(accessToken);
      setUser(profile as UserProfile);
      setToken(accessToken);
      setMfaPending(false);
      setTempToken(null);
    } catch {
      setUser(null);
      setToken(null);
      setMfaPending(false);
      setTempToken(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      if (data.session) {
        loadProfile(data.session.access_token).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      if (session) {
        loadProfile(session.access_token);
      } else {
        setUser(null);
        setToken(null);
        setMfaPending(false);
        setTempToken(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);

    await loadProfile(data.session.access_token);
  };

  const verifyMfa = async (otp: string) => {
    if (!tempToken) throw new Error("No pending session found");

    const res = await fetch(`${import.meta.env.VITE_API_URL ?? "http://localhost:5000"}/api/mfa/verify`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${tempToken}`,
        "x-device-id": getDeviceId(),
      },
      body: JSON.stringify({ otp }),
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "MFA Verification failed");
    }

    // Load profile properly after successful MFA
    const profile = await getMe(tempToken);
    setUser(profile as UserProfile);
    setToken(tempToken);
    setMfaPending(false);
    setTempToken(null);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setToken(null);
    setMfaPending(false);
    setTempToken(null);
  };

  const changePassword = async (currentPassword: string, newPassword: string) => {
    if (!user) throw new Error("Not logged in");

    // Re-authenticate to verify the current password
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error("Incorrect current password.");
    }

    // Update to the new password
    const { error: updateError } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (updateError) {
      throw new Error(updateError.message);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, mfaPending, login, verifyMfa, logout, changePassword }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};