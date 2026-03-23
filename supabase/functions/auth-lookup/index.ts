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
  await res.text(); // consume body
  return res.ok;
};

/** Rate limiting: max N requests per key in a rolling window */
const checkRateLimit = async (
  supabaseAdmin: any,
  key: string,
  maxRequests: number,
  windowMinutes: number
): Promise<boolean> => {
  // Cleanup old entries occasionally (1 in 20 chance)
  if (Math.random() < 0.05) {
    try { await supabaseAdmin.rpc("cleanup_rate_limits"); } catch {}
  }

  const since = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
  const { count } = await supabaseAdmin
    .from("rate_limits")
    .select("id", { count: "exact", head: true })
    .eq("key", key)
    .gte("created_at", since);

  if ((count ?? 0) >= maxRequests) return false; // rate limited

  // Record this request
  await supabaseAdmin.from("rate_limits").insert({ key });
  return true; // allowed
};

const getClientIp = (req: Request): string => {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
};

/** Find profile by phone */
const findProfileByPhone = async (supabaseAdmin: any, normalizedLocal: string) => {
  const intl = toIntl(normalizedLocal);

  const { data } = await supabaseAdmin
    .from("profiles")
    .select("user_id, phone, needs_password, registration_token")
    .or(`phone.eq.${normalizedLocal},phone.eq.${intl},phone.eq.+${intl}`);

  if (data?.[0]) return data[0];

  const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
  const match = (allUsers || []).find((u: any) => {
    const meta = (u.raw_user_meta_data?.phone || u.user_metadata?.phone || "").replace(/[\s\-\+\(\)]/g, "");
    return meta === normalizedLocal || meta === intl || meta === `+${intl}`;
  });
  if (!match) return null;

  await supabaseAdmin
    .from("profiles")
    .update({ phone: normalizedLocal })
    .eq("user_id", match.id);

  const { data: profileData } = await supabaseAdmin
    .from("profiles")
    .select("user_id, phone, needs_password, registration_token")
    .eq("user_id", match.id)
    .maybeSingle();

  return profileData ?? null;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

    let body: any;
    try {
      body = await req.json();
    } catch {
      return json({ error: "Invalid JSON body" }, 400);
    }
    const { action } = body || {};
    const clientIp = getClientIp(req);

    // Rate limit all actions: 20 requests per IP per 5 minutes
    const rateLimitKey = `auth-lookup:${clientIp}`;
    const allowed = await checkRateLimit(supabaseAdmin, rateLimitKey, 20, 5);
    if (!allowed) {
      return json({ error: "Too many requests. Please try again later." }, 429);
    }

    /* ── action: "login" ── resolve phone → email */
    if (action === "login") {
      const { phone } = body;
      if (!phone) return json({ error: "phone required" }, 400);
      const local = normalizePhone(phone);
      const profile = await findProfileByPhone(supabaseAdmin, local);
      if (!profile) return json({ email: null, found: false });
      if (profile.needs_password) return json({ email: null, found: true, needs_password: true });
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
      const authEmail = userData?.user?.email;
      if (!authEmail) return json({ email: null, found: false });
      return json({ email: authEmail, found: true, needs_password: false });
    }

    /* ── action: "forgot_password" ── phone reset via SMS */
    if (action === "forgot_password") {
      const { phone, origin, locale } = body;
      if (!phone) return json({ error: "phone required" }, 400);

      // Stricter rate limit for forgot_password: 3 per IP per 15 minutes
      const fpKey = `forgot-pw:${clientIp}`;
      const fpAllowed = await checkRateLimit(supabaseAdmin, fpKey, 3, 15);
      if (!fpAllowed) {
        return json({ error: "Too many password reset attempts. Please try again later." }, 429);
      }

      const local = normalizePhone(phone);
      const profile = await findProfileByPhone(supabaseAdmin, local);
      if (!profile) return json({ sent: false, reason: "not_found" });

      if (profile.needs_password) {
        return json({ sent: false, reason: "needs_password" });
      }
      const { data: userData } = await supabaseAdmin.auth.admin.getUserById(profile.user_id);
      if (!userData?.user?.email) return json({ sent: false, reason: "not_found" });
      const userEmail = userData.user.email;
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
        return json({ sent: true, via: "email" });
      }
      const msg = `שלום 👋\nלאיפוס הסיסמה שלך לחץ על הקישור:\n${resetLink}\n\n🏗 AMG PERGOLA`;
      const smsSent = await sendSmsViaApi(supabaseAdmin, local, msg);
      return json({ sent: true, via: smsSent ? "sms" : "email" });
    }

    /* ── action: "get_order_data" ── check if phone has orders */
    if (action === "get_order_data") {
      const { phone } = body;
      if (!phone) return json({ found: false });
      const local = normalizePhone(phone);
      const intl = toIntl(local);
      const { data: orders } = await supabaseAdmin
        .from("orders")
        .select("id")
        .or(`phone.eq.${local},phone.eq.${intl},phone.eq.+${intl}`)
        .limit(1);
      if (!orders?.[0]) return json({ found: false });
      return json({ found: true });
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
      const { data: { users: allUsers } } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      const exists = (allUsers || []).some((u: any) => u.email?.toLowerCase() === email.toLowerCase());
      return json({ exists });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (err: any) {
    console.error("auth-lookup error:", err);
    return json({ error: "Internal error" }, 500);
  }
});
