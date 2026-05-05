import supabase from "../config/supabaseClient.js";
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) {
    console.log("AUTH: No token provided");
    return res.status(401).json({ error: "Unauthorized" });
  }

  console.log("AUTH: Token received, validating...");

  const { data, error } = await supabase.auth.getUser(token);

  if (error) {
    console.log("AUTH: getUser error:", error.message);
    return res.status(401).json({ error: "Unauthorized" });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, name, email, role, manager_id")
    .eq("id", data.user.id)
    .single();

  if (profileError) {
    console.log("AUTH: Profile fetch error:", profileError.message);
    return res.status(401).json({ error: "User profile not found" });
  }

  if (!profile) {
    console.log("AUTH: No profile found for user id:", data.user.id);
    return res.status(401).json({ error: "User profile not found" });
  }

  req.user = profile;

  // Skip MFA check for MFA routes
  if (req.originalUrl.startsWith("/api/mfa")) {
    return next();
  }

  // Enforce MFA
  const deviceId = req.headers["x-device-id"];
  const ipAddress = req.ip || req.headers["x-forwarded-for"] || "0.0.0.0";

  if (!deviceId) {
    return res.status(403).json({ error: "MFA_REQUIRED", message: "Device ID missing" });
  }

  const { data: session } = await supabase
    .from("device_sessions")
    .select("*")
    .eq("user_id", profile.id)
    .eq("device_id", deviceId)
    .eq("ip_address", ipAddress)
    .eq("is_verified", true)
    .single();

  if (!session) {
    return res.status(403).json({ error: "MFA_REQUIRED", message: "Unverified device or IP" });
  }

  const now = new Date();
  const lastActive = new Date(session.last_active_at);
  const diffTime = Math.abs(now - lastActive);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays > 7) {
    return res.status(403).json({ error: "MFA_REQUIRED", message: "Session expired due to inactivity" });
  }

  // Optionally update last active here, but it might be too many writes if done on every request.
  // We'll rely on the frontend explicitly calling /api/mfa/check on login, or we can update it sparingly.

  next();
};
export default authenticate;



