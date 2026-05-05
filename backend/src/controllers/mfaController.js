import supabase from "../config/supabaseClient.js";
import { sendOtpEmail } from "../services/emailService.js";
import crypto from "crypto";

const generateOtp = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

export const checkMfa = async (req, res) => {
  try {
    const user = req.user; // from authenticate middleware
    const deviceId = req.headers["x-device-id"];
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "0.0.0.0";

    if (!deviceId) {
      return res.status(400).json({ error: "Device ID is required" });
    }

    // Check if a verified session exists
    const { data: session, error: sessionError } = await supabase
      .from("device_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("device_id", deviceId)
      .eq("ip_address", ipAddress)
      .eq("is_verified", true)
      .single();

    const now = new Date();
    let requiresMfa = false;

    if (!session || sessionError) {
      // No verified session found (New Device or New IP)
      requiresMfa = true;
    } else {
      const lastActive = new Date(session.last_active_at);
      const diffTime = Math.abs(now - lastActive);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 

      if (diffDays > 7) {
        // Inactivity > 7 days
        requiresMfa = true;
      }
    }

    if (requiresMfa) {
      // Generate OTP
      const otp = generateOtp();
      const expiresAt = new Date(now.getTime() + 10 * 60000); // 10 mins

      await supabase.from("user_otps").insert([
        {
          user_id: user.id,
          otp_code: otp,
          purpose: "login",
          expires_at: expiresAt.toISOString(),
        },
      ]);

      await sendOtpEmail(user.email, otp, "login");
      return res.status(200).json({ requires_mfa: true, message: "OTP sent to email" });
    } else {
      // Update last active
      await supabase
        .from("device_sessions")
        .update({ last_active_at: now.toISOString() })
        .eq("id", session.id);

      return res.status(200).json({ requires_mfa: false });
    }
  } catch (error) {
    console.error("MFA Check Error:", error);
    res.status(500).json({ error: "Server error during MFA check" });
  }
};

export const verifyMfa = async (req, res) => {
  try {
    const user = req.user;
    const { otp } = req.body;
    const deviceId = req.headers["x-device-id"];
    const ipAddress = req.ip || req.headers["x-forwarded-for"] || "0.0.0.0";

    if (!otp || !deviceId) {
      return res.status(400).json({ error: "OTP and Device ID are required" });
    }

    // Find valid OTP
    const { data: otps, error: otpError } = await supabase
      .from("user_otps")
      .select("*")
      .eq("user_id", user.id)
      .eq("purpose", "login")
      .eq("is_used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (otpError || !otps || otps.length === 0) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    const validOtp = otps[0];

    if (validOtp.otp_code !== otp) {
      return res.status(400).json({ error: "Incorrect OTP" });
    }

    // Mark OTP as used
    await supabase.from("user_otps").update({ is_used: true }).eq("id", validOtp.id);

    // Upsert device session
    const { data: existingSession } = await supabase
      .from("device_sessions")
      .select("*")
      .eq("user_id", user.id)
      .eq("device_id", deviceId)
      .eq("ip_address", ipAddress)
      .single();

    if (existingSession) {
      await supabase
        .from("device_sessions")
        .update({ is_verified: true, last_active_at: new Date().toISOString() })
        .eq("id", existingSession.id);
    } else {
      await supabase.from("device_sessions").insert([
        {
          user_id: user.id,
          device_id: deviceId,
          ip_address: ipAddress,
          is_verified: true,
          last_active_at: new Date().toISOString(),
        },
      ]);
    }

    res.status(200).json({ message: "MFA verified successfully" });
  } catch (error) {
    console.error("MFA Verify Error:", error);
    res.status(500).json({ error: "Server error during MFA verify" });
  }
};

export const sendResetOtp = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .single();

    if (userError || !user) {
      // To prevent email enumeration, return a generic success message
      return res.status(200).json({ message: "If the email is registered, an OTP has been sent." });
    }

    const otp = generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60000); // 10 mins

    await supabase.from("user_otps").insert([
      {
        user_id: user.id,
        otp_code: otp,
        purpose: "password_reset",
        expires_at: expiresAt.toISOString(),
      },
    ]);

    await sendOtpEmail(user.email, otp, "password_reset");
    
    res.status(200).json({ message: "If the email is registered, an OTP has been sent." });
  } catch (error) {
    console.error("Send Reset OTP Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};

export const verifyResetOtp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({ error: "Email and OTP are required" });
    }

    const { data: user } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .single();

    if (!user) {
      return res.status(400).json({ error: "Invalid request" });
    }

    // Find valid OTP
    const { data: otps } = await supabase
      .from("user_otps")
      .select("*")
      .eq("user_id", user.id)
      .eq("purpose", "password_reset")
      .eq("is_used", false)
      .gte("expires_at", new Date().toISOString())
      .order("created_at", { ascending: false })
      .limit(1);

    if (!otps || otps.length === 0 || otps[0].otp_code !== otp) {
      return res.status(400).json({ error: "Invalid or expired OTP" });
    }

    // Since we verified the OTP, we can reset the user's password using the admin API
    // Wait, the client usually passes the new_password here.
    const { new_password } = req.body;
    if(!new_password) {
       // Just verification step
       return res.status(200).json({ message: "OTP is valid", otp_token: otps[0].id });
    }

    // Mark OTP as used
    await supabase.from("user_otps").update({ is_used: true }).eq("id", otps[0].id);

    // Reset password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      user.id,
      { password: new_password }
    );

    if (updateError) {
      return res.status(400).json({ error: updateError.message });
    }

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Verify Reset OTP Error:", error);
    res.status(500).json({ error: "Server error" });
  }
};
