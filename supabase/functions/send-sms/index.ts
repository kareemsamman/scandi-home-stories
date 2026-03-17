import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/** Convert Israeli local number to 019 international format */
const formatPhone = (phone: string): string => {
  const clean = phone.replace(/[\s\-\+]/g, "");
  if (clean.startsWith("972")) return clean;
  if (clean.startsWith("0")) return "972" + clean.slice(1);
  return clean;
};

/** Escape XML special characters */
const escapeXml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { phone, message } = await req.json();

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone and message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Read SMS settings from DB using service role key
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: settingsRow } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "sms")
      .single();

    const s = settingsRow?.value as any;

    if (!s?.enabled) {
      return new Response(JSON.stringify({ success: false, reason: "SMS disabled" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const dlr = crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const formattedPhone = formatPhone(phone);

    // 019 SMS API — XML format (same as working PHP implementation)
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sms>
    <user><username>${escapeXml(s.user)}</username></user>
    <source>${escapeXml(s.source)}</source>
    <destinations><phone id="${dlr}">${formattedPhone}</phone></destinations>
    <message>${escapeXml(message)}</message>
</sms>`;

    const response = await fetch("https://019sms.co.il/api", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${s.token}`,
        "Content-Type": "application/xml",
        "charset": "utf-8",
      },
      body: xml,
    });

    const result = await response.text();

    return new Response(
      JSON.stringify({ success: response.ok, status: response.status, result }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
