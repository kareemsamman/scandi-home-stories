import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/[\s\-\+\(\)]/g, "");
  if (digits.startsWith("972")) return "0" + digits.slice(3);
  if (digits.startsWith("00972")) return "0" + digits.slice(5);
  return digits;
};

const toIntl = (local: string): string => {
  const d = local.replace(/\D/g, "");
  return d.startsWith("0") ? "972" + d.slice(1) : d;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { phone, password, firstName, lastName, email: newEmail } = await req.json();

    if (!phone || !password || password.length < 6) {
      return json({ error: "Phone and password (min 6 chars) required" }, 400);
    }

    const local = normalizePhone(phone);
    const intl = toIntl(local);

    // Find profile by phone
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, needs_password")
      .or(`phone.eq.${local},phone.eq.${intl},phone.eq.+${intl}`);

    const profile = profiles?.[0];
    if (!profile) return json({ error: "not_found" }, 404);
    if (!profile.needs_password) return json({ error: "already_has_password" }, 400);

    // Update password (and optionally email) using service role
    const authUpdate: any = { password };
    if (newEmail && !newEmail.includes("@no-email.amg-pergola.com")) {
      authUpdate.email = newEmail;
      authUpdate.email_confirm = true;
    }
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      profile.user_id,
      authUpdate
    );
    if (updateErr) return json({ error: updateErr.message }, 500);

    // Determine the final email on this auth account (after possible update)
    const { data: updatedUser } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
    const finalEmail = updatedUser?.user?.email ?? "";

    // Update profile: mark password set + save name + store email for phone-login resolution
    const profileUpdate: any = { needs_password: false };
    if (firstName) profileUpdate.first_name = firstName;
    if (lastName) profileUpdate.last_name = lastName;
    if (finalEmail) profileUpdate.email = finalEmail;
    await supabaseAdmin
      .from("profiles")
      .update(profileUpdate)
      .eq("user_id", profile.user_id);

    // Link all orders with this phone to this user (covers placeholder accounts and guest orders)
    await supabaseAdmin
      .from("orders")
      .update({ user_id: profile.user_id })
      .or(`phone.eq.${local},phone.eq.${intl},phone.eq.+${intl}`);

    // Get email to sign in
    const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
    const email = userData?.user?.email;
    if (!email) return json({ error: "no_email" }, 500);

    // Sign in the user and return session
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data: session, error: signInErr } = await anonClient.auth.signInWithPassword({ email, password });
    if (signInErr) return json({ error: signInErr.message }, 500);

    return json({ success: true, session: session.session });
  } catch (err: any) {
    console.error("set-password error:", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
});
