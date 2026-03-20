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
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const { phone, password } = await req.json();

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

    // Update password using service role
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      profile.user_id,
      { password }
    );
    if (updateErr) return json({ error: updateErr.message }, 500);

    // Mark needs_password = false
    await supabaseAdmin
      .from("profiles")
      .update({ needs_password: false })
      .eq("user_id", profile.user_id);

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
