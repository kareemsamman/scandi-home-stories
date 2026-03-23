import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const formatPhone = (phone: string): string => {
  const clean = phone.replace(/[\s\-\+]/g, "");
  if (clean.startsWith("972")) return clean;
  if (clean.startsWith("0")) return "972" + clean.slice(1);
  return clean;
};

const escapeXml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

const getClientIp = (req: Request): string => {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl    = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin  = createClient(supabaseUrl, serviceRoleKey);

    const { name, email, phone, message, locale } = await req.json();

    // ── Basic server-side validation ────────────────────────────────────
    if (!name?.trim() || !email?.trim() || !message?.trim()) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email address" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (name.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Name too short" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Rate limiting: 5 submissions per IP per 15 minutes ──────────────
    const clientIp = getClientIp(req);
    const rateLimitKey = `contact:${clientIp}`;
    const since = new Date(Date.now() - 15 * 60 * 1000).toISOString();

    // Cleanup old entries occasionally
    if (Math.random() < 0.05) {
      try { await supabaseAdmin.rpc("cleanup_rate_limits"); } catch {}
    }

    const { count } = await supabaseAdmin
      .from("rate_limits")
      .select("id", { count: "exact", head: true })
      .eq("key", rateLimitKey)
      .gte("created_at", since);

    if ((count ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: "Too many submissions. Please try again later." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Record this request
    await supabaseAdmin.from("rate_limits").insert({ key: rateLimitKey });

    // ── Save submission to DB ────────────────────────────────────────────
    try {
      await supabaseAdmin.from("contact_submissions").insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        message: message.trim(),
        locale: locale || "he",
      });
    } catch { /* graceful if table missing */ }

    // ── Read SMS settings from DB ────────────────────────────────────────
    const { data: settingsRow } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "sms")
      .maybeSingle();

    const s = settingsRow?.value as any;

    if (!s?.enabled || !s?.user || !s?.token || !s?.admin_phone) {
      return new Response(JSON.stringify({ success: true, sms_sent: false, reason: "SMS not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Build SMS message ────────────────────────────────────────────────
    const phoneDisplay = phone?.trim() ? `\nטל: ${phone.trim()}` : "";
    const smsText =
      `📬 פנייה חדשה מהאתר\n` +
      `שם: ${name.trim()}\n` +
      `אימייל: ${email.trim()}` +
      `${phoneDisplay}\n` +
      `הודעה: ${message.trim().slice(0, 120)}${message.trim().length > 120 ? "…" : ""}`;

    // ── Send via 019 SMS API ─────────────────────────────────────────────
    const dlr = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const adminPhone = formatPhone(s.admin_phone);

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sms>
    <user><username>${escapeXml(s.user)}</username></user>
    <source>${escapeXml(s.source || "AMGPergola")}</source>
    <destinations><phone id="${dlr}">${adminPhone}</phone></destinations>
    <message>${escapeXml(smsText)}</message>
</sms>`;

    const smsRes = await fetch("https://019sms.co.il/api", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${s.token}`,
        "Content-Type": "application/xml",
        "charset": "utf-8",
      },
      body: xml,
    });

    const smsResult = await smsRes.text();

    if (!smsRes.ok) {
      console.error("019 SMS error:", smsResult);
      return new Response(JSON.stringify({ success: true, sms_sent: false, reason: "SMS send failed" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, sms_sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
