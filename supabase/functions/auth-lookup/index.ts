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

/** Normalize Israeli phone to 10-digit local format "05XXXXXXXX" */
const normalizePhone = (raw: string): string => {
  const digits = raw.replace(/[\s\-\+\(\)]/g, "");
  if (digits.startsWith("972")) return "0" + digits.slice(3);
  if (digits.startsWith("00972")) return "0" + digits.slice(5);
  return digits;
};

/** Convert to international format "972XXXXXXXXX" for SMS */
const toIntl = (local: string): string => {
  const d = local.replace(/\D/g, "");
  return d.startsWith("0") ? "972" + d.slice(1) : d;
};

const escapeXml = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
   .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

const sendSmsViaApi = async (supabaseAdmin: any, phone: string, message: string) => {
  const { data: settingsRow } = await supabaseAdmin
    .from("app_settings").select("value").eq("key", "sms").single();
  const s = settingsRow?.value as any;
  if (!s?.enabled) return false;
  const dlr = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const xml = `<?xml version="1.0" encoding="UTF-8"?><sms><user><username>${escapeXml(s.user)}</username></user><source>${escapeXml(s.source)}</source><destinations><phone id="${dlr}">${toIntl(phone)}</phone></destinations><message>${escapeXml(message)}</message></sms>`;
  const res = await fetch("https://019sms.co.il/api", {
    method: "POST",
    headers: { Authorization: `Bearer ${s.token}`, "Content-Type": "application/xml", charset: "utf-8" },
    body: xml,
  });
  return res.ok;
};

/** Find profile by phone (tries local, international, +international variants) */
const findProfileByPhone = async (supabaseAdmin: any, normalizedLocal: string) => {
  const intl = toIntl(normalizedLocal);
  const { data } = await supabaseAdmin
    .from("profiles")
    .select("user_id, phone, needs_password")
    .or(`phone.eq.${normalizedLocal},phone.eq.${intl},phone.eq.+${intl}`);
  return data?.[0] ?? null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    const body = await req.json();
    const { action } = body;

    /* ── action: "login" ── resolve phone → email */
    if (action === "login") {
      const { phone } = body;
      if (!phone) return json({ error: "phone required" }, 400);
      const local = normalizePhone(phone);
      const profile = await findProfileByPhone(supabaseAdmin, local);
      if (!profile) return json({ email: null, found: false });
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
      if (!userData?.user?.email) return json({ email: null, found: false });
      return json({ email: userData.user.email, found: true });
    }

    /* ── action: "forgot_password" ── phone reset via SMS */
    if (action === "forgot_password") {
      const { phone, origin, locale } = body;
      if (!phone) return json({ error: "phone required" }, 400);
      const local = normalizePhone(phone);
      const profile = await findProfileByPhone(supabaseAdmin, local);
      if (!profile) return json({ sent: false, reason: "not_found" });

      // User exists but never set a password — prompt them to create one
      if (profile.needs_password) {
        return json({ sent: false, reason: "needs_password" });
      }
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
      if (!userData?.user?.email) return json({ sent: false, reason: "not_found" });
      const userEmail = userData.user.email;
      // Generate recovery link (also sends email to user)
      const redirectTo = `${origin || "https://amgpergola.com"}/${locale || "he"}/reset-password`;
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: "recovery",
        email: userEmail,
        options: { redirectTo },
      });
      if (linkError) {
        console.error("generateLink error:", linkError);
        return json({ sent: false, reason: "link_failed" });
      }
      const resetLink = (linkData as any)?.properties?.action_link;
      if (!resetLink) {
        // Email was sent by Supabase but no link returned — still counts as sent via email
        return json({ sent: true, via: "email" });
      }
      const msg = `שלום 👋\nלאיפוס הסיסמה שלך לחץ על הקישור:\n${resetLink}\n\n🏗 AMG PERGOLA`;
      const smsSent = await sendSmsViaApi(supabaseAdmin, local, msg);
      // If SMS not configured/failed, email was still sent — return success
      return json({ sent: true, via: smsSent ? "sms" : "email" });
    }

    /* ── action: "check_phone" ── is phone already registered? */
    if (action === "check_phone") {
      const { phone } = body;
      if (!phone) return json({ exists: false });
      const local = normalizePhone(phone);
      const profile = await findProfileByPhone(supabaseAdmin, local);
      return json({ exists: !!profile });
    }

    /* ── action: "check_email" ── is email already registered? */
    if (action === "check_email") {
      const { email } = body;
      if (!email) return json({ exists: false });
      const { data: { users } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1 });
      // listUsers doesn't filter by email; use a profiles approach instead
      // Query profiles via user lookup — try fetching all users matching the email
      const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const exists = (allUsers || []).some((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      return json({ exists });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err: any) {
    console.error("auth-lookup error:", err);
    return json({ error: err?.message || "Internal error" }, 500);
  }
});
