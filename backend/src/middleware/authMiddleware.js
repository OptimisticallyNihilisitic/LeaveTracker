import supabase from "../config/supabaseClient.js";

const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ error: "Unauthorized" });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) return res.status(401).json({ error: "Unauthorized" });

  // Fetch role and profile from users table (same UUID)
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("id, name, email, role, manager_id")
    .eq("id", data.user.id)
    .single();

  if (profileError || !profile) return res.status(401).json({ error: "User profile not found" });

  req.user = profile;
  next();
};

export default authenticate;