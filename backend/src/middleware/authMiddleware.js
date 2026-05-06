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

  next();
};
export default authenticate;



