import supabase from "../config/supabaseClient.js";

export const getInvitationDetails = async (req, res) => {
  try {
    const { token } = req.params;
    const { data, error } = await supabase
      .from("invitations")
      .select("name, email, role, status")
      .eq("token", token)
      .single();

    if (error || !data) {
      return res.status(404).json({ error: "Invalid or expired invitation link." });
    }

    if (data.status !== "pending") {
      return res.status(400).json({ error: "This invitation has already been accepted or cancelled." });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: "Server error checking invitation." });
  }
};

export const acceptInvitation = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    if (!password || password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters." });
    }

    const { data: inv, error: invError } = await supabase
      .from("invitations")
      .select("*")
      .eq("token", token)
      .single();

    if (invError || !inv) {
      return res.status(404).json({ error: "Invalid invitation link." });
    }

    if (inv.status !== "pending") {
      return res.status(400).json({ error: "This invitation is no longer pending." });
    }

    const currentYear = new Date().getFullYear();
    let defaultPolicy = { sick_leaves: 0, casual_leaves: 0, floater_leaves: 0 };
    const { data: policyData } = await supabase
      .from("policies")
      .select("sick_leaves, casual_leaves, floater_leaves")
      .eq("year", currentYear)
      .maybeSingle();

    if (policyData) {
      defaultPolicy = policyData;
    } else {
      const { data: fallback } = await supabase
        .from("policies")
        .select("sick_leaves, casual_leaves, floater_leaves")
        .order("year", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (fallback) defaultPolicy = fallback;
    }

    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: inv.email,
      password: password,
      email_confirm: true,
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    const userId = authData.user.id;

    const normalizedRole = (inv.role ?? "employee").toLowerCase();

    const { error: dbError } = await supabase
      .from("users")
      .insert({
        id: userId,
        email: inv.email,
        name: inv.name,
        employee_id: inv.employee_id,
        role: normalizedRole,
        manager_id: inv.manager_id,
        sick_leaves: defaultPolicy.sick_leaves,
        casual_leaves: defaultPolicy.casual_leaves,
        floater_leaves: defaultPolicy.floater_leaves,
      });

    if (dbError) {
      await supabase.auth.admin.deleteUser(userId);
      return res.status(500).json({
        error: dbError.message,
        details: { role: normalizedRole },
      });
    }

    await supabase
      .from("invitations")
      .update({ status: "accepted", updated_at: new Date().toISOString() })
      .eq("id", inv.id);

    res.json({ message: "Account setup successfully. You can now login." });
  } catch (err) {
    res.status(500).json({ error: "Server error accepting invitation." });
  }
};
