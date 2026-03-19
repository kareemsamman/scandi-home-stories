import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl      = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin    = createClient(supabaseUrl, serviceRoleKey);

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

    if (name.trim().length < 2 || message.trim().length < 10) {
      return new Response(JSON.stringify({ error: "Name or message too short" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Read email settings from DB ─────────────────────────────────────
    const { data: settingsRow } = await supabaseAdmin
      .from("app_settings")
      .select("value")
      .eq("key", "email")
      .maybeSingle();

    const emailSettings = settingsRow?.value as any;

    if (!emailSettings?.enabled || !emailSettings?.resend_api_key || !emailSettings?.admin_email) {
      // Still save submission even if email is disabled
      await supabaseAdmin.from("contact_submissions").insert({
        name: name.trim(),
        email: email.trim(),
        phone: phone?.trim() || null,
        message: message.trim(),
        locale: locale || "he",
      }).throwOnError().then(() => {}).catch(() => {}); // ignore if table doesn't exist

      return new Response(JSON.stringify({ success: true, email_sent: false, reason: "Email not configured" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminEmail = emailSettings.admin_email;
    const fromEmail  = emailSettings.from_email || "noreply@amgpergola.co.il";
    const apiKey     = emailSettings.resend_api_key;

    // ── Build email HTML ────────────────────────────────────────────────
    const html = `
<!DOCTYPE html>
<html dir="rtl" lang="he">
<head><meta charset="utf-8"><style>
  body { font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px; }
  .card { background: #fff; border-radius: 12px; padding: 32px; max-width: 560px; margin: 0 auto; }
  .header { background: #111; color: #fff; padding: 20px 32px; border-radius: 12px 12px 0 0; margin: -32px -32px 24px; }
  .header h1 { margin: 0; font-size: 18px; }
  .row { margin-bottom: 16px; }
  .label { font-size: 11px; font-weight: 700; color: #888; text-transform: uppercase; letter-spacing: 0.05em; margin-bottom: 4px; }
  .value { font-size: 15px; color: #111; }
  .message-box { background: #f8f8f8; border-radius: 8px; padding: 16px; font-size: 15px; color: #333; white-space: pre-wrap; line-height: 1.6; }
  .footer { font-size: 12px; color: #aaa; text-align: center; margin-top: 24px; }
</style></head>
<body>
<div class="card">
  <div class="header"><h1>📬 פנייה חדשה מהאתר</h1></div>
  <div class="row"><div class="label">שם</div><div class="value">${escapeHtml(name.trim())}</div></div>
  <div class="row"><div class="label">אימייל</div><div class="value"><a href="mailto:${escapeHtml(email.trim())}">${escapeHtml(email.trim())}</a></div></div>
  ${phone ? `<div class="row"><div class="label">טלפון</div><div class="value"><a href="tel:${escapeHtml(phone.trim())}">${escapeHtml(phone.trim())}</a></div></div>` : ""}
  <div class="row"><div class="label">הודעה</div><div class="message-box">${escapeHtml(message.trim())}</div></div>
  <div class="footer">AMG Pergola — פנייה נשלחה מהאתר</div>
</div>
</body></html>`;

    // ── Send via Resend ─────────────────────────────────────────────────
    const resendRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `AMG Pergola <${fromEmail}>`,
        to: [adminEmail],
        reply_to: email.trim(),
        subject: `📬 פנייה חדשה מ-${name.trim()}`,
        html,
      }),
    });

    const resendData = await resendRes.json();

    // ── Save submission to DB ───────────────────────────────────────────
    await supabaseAdmin.from("contact_submissions").insert({
      name: name.trim(),
      email: email.trim(),
      phone: phone?.trim() || null,
      message: message.trim(),
      locale: locale || "he",
      email_sent: resendRes.ok,
    }).throwOnError().then(() => {}).catch(() => {}); // graceful if table missing

    if (!resendRes.ok) {
      console.error("Resend error:", resendData);
      return new Response(JSON.stringify({ success: false, error: resendData?.message || "Email send failed" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, email_sent: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
